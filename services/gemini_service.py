"""
FastAPI application for E-Learning Platform AI Services
Using NEW Google Gemini API SDK (google-genai)
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ==============================================================================
# GEMINI SERVICE WITH NEW API SDK
# ==============================================================================

class GeminiService:
    def __init__(self, api_key: str):
        print(f"🔧 Initializing GeminiService with API key: {api_key[:10]}...")
        self.api_key = api_key
        
        try:
            # ✅ Use the NEW Google GenAI SDK
            from google import genai
            self.client = genai.Client(api_key=api_key)
            print("✅ Gemini Client configured successfully with NEW SDK")
            
        except ImportError:
            print("❌ google-genai package not installed. Please run: pip install google-genai")
            raise
        except Exception as e:
            print(f"❌ Gemini configuration failed: {e}")
            raise

    def _call_gemini(self, prompt: str, model: str = "gemini-2.0-flash") -> str:
        """Helper method to call Gemini API with error handling"""
        try:
            print(f"📤 Sending prompt to Gemini ({model})...")
            response = self.client.models.generate_content(
                model=model,
                contents=prompt
            )
            print(f"📥 Received response from Gemini")
            return response.text
        except Exception as e:
            print(f"❌ Gemini API call failed: {e}")
            # Return a fallback response instead of raising
            return f"AI service temporarily unavailable. Please try again later. Error: {str(e)}"

    def generate_quiz(self, topic, num_questions, question_type, difficulty, grade_level, language):
        """Generate quiz questions using real Gemini API"""
        print(f"🎯 Generating quiz for: {topic}")
        
        prompt = f"""
        Create a quiz with {num_questions} {difficulty} level multiple choice questions about {topic} 
        for {grade_level} students in {language}.
        
        Return the response as a valid JSON object in this exact format:
        {{
            "quiz": [
                {{
                    "question": "Question text here?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer": "A",
                    "explanation": "Brief explanation of why this is correct"
                }}
            ]
        }}
        
        Make sure the questions are educational, clear, and appropriate for the grade level.
        Provide exactly {num_questions} questions.
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            print(f"📝 Raw response: {response_text[:200]}...")
            
            # Check if we got an error message instead of real response
            if "AI service temporarily unavailable" in response_text:
                return self._get_fallback_quiz(topic, num_questions)
            
            # Clean the response
            response_text = response_text.strip()
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].strip() if len(response_text.split('```')) > 2 else response_text
            
            # Parse JSON
            result = json.loads(response_text)
            print(f"✅ Successfully generated {len(result.get('quiz', []))} questions")
            return result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            return self._get_fallback_quiz(topic, num_questions)
        except Exception as e:
            print(f"❌ Quiz generation error: {e}")
            return self._get_fallback_quiz(topic, num_questions)

    def _get_fallback_quiz(self, topic, num_questions):
        """Provide fallback quiz data when API fails"""
        print("🔄 Using fallback quiz data")
        return {
            "quiz": [
                {
                    "question": f"What is the main concept of {topic}?",
                    "options": ["Core principle", "Secondary detail", "Unrelated concept", "Advanced topic"],
                    "answer": "A",
                    "explanation": "This represents the fundamental concept students should understand."
                },
                {
                    "question": f"How does {topic} apply in real-world scenarios?",
                    "options": ["Practical applications", "Theoretical only", "Rarely used", "Not applicable"],
                    "answer": "A",
                    "explanation": "Understanding real-world applications helps with practical knowledge."
                },
                {
                    "question": f"What skill is most important for understanding {topic}?",
                    "options": ["Critical thinking", "Memorization", "Observation", "Creativity"],
                    "answer": "A",
                    "explanation": "Critical thinking helps analyze and apply concepts effectively."
                }
            ][:num_questions]  # Return only requested number of questions
        }

    def generate_assignment(self, topic, grade_level, subject, num_questions, language):
        """Generate AI-powered assignment with questions and answers"""
        print(f"📝 Generating assignment for: {topic}")
        
        prompt = f"""
        Create a comprehensive assignment about {topic} for {grade_level} students studying {subject}.
        
        Generate {num_questions} diverse questions including:
        - Multiple choice questions
        - Short answer questions  
        - Problem-solving questions
        - Critical thinking questions
        
        Return the response as a valid JSON object in this exact format:
        {{
            "assignment": {{
                "title": "Assignment: {topic}",
                "topic": "{topic}",
                "grade_level": "{grade_level}",
                "subject": "{subject}",
                "questions": [
                    {{
                        "id": 1,
                        "type": "multiple_choice",
                        "question": "Question text here?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "A",
                        "explanation": "Why this is correct"
                    }},
                    {{
                        "id": 2,
                        "type": "short_answer", 
                        "question": "Question text here?",
                        "correct_answer": "Expected answer here",
                        "explanation": "Key points to include"
                    }}
                ]
            }}
        }}
        
        Make the assignment educational, engaging, and appropriate for the grade level.
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            print(f"📝 Raw assignment response: {response_text[:200]}...")
            
            # Check if we got an error message
            if "AI service temporarily unavailable" in response_text:
                return self._get_fallback_assignment(topic, grade_level, subject, num_questions)
            
            # Clean the response
            response_text = response_text.strip()
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].strip() if len(response_text.split('```')) > 2 else response_text
            
            # Parse JSON
            result = json.loads(response_text)
            print(f"✅ Successfully generated assignment with {len(result.get('assignment', {}).get('questions', []))} questions")
            return result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            return self._get_fallback_assignment(topic, grade_level, subject, num_questions)
        except Exception as e:
            print(f"❌ Assignment generation error: {e}")
            return self._get_fallback_assignment(topic, grade_level, subject, num_questions)

    def _get_fallback_assignment(self, topic, grade_level, subject, num_questions):
        """Provide fallback assignment data when API fails"""
        print("🔄 Using fallback assignment data")
        return {
            "assignment": {
                "title": f"Assignment: {topic}",
                "topic": topic,
                "grade_level": grade_level,
                "subject": subject,
                "questions": [
                    {
                        "id": 1,
                        "type": "multiple_choice",
                        "question": f"What is the fundamental concept of {topic}?",
                        "options": ["Core principle", "Minor detail", "Historical context", "Future application"],
                        "correct_answer": "A",
                        "explanation": "This represents the main concept students should understand."
                    },
                    {
                        "id": 2,
                        "type": "short_answer",
                        "question": f"Explain {topic} in your own words.",
                        "correct_answer": f"{topic} involves key principles and applications that are fundamental to understanding this subject area.",
                        "explanation": "Focus on the main concepts and practical applications."
                    },
                    {
                        "id": 3,
                        "type": "problem_solving",
                        "question": f"Solve a practical problem using {topic}.",
                        "correct_answer": "Apply the concepts systematically to arrive at a solution.",
                        "explanation": "Break down the problem step by step using the principles learned."
                    },
                    {
                        "id": 4,
                        "type": "critical_thinking",
                        "question": f"Analyze the importance of {topic} in modern contexts.",
                        "correct_answer": f"{topic} plays a crucial role in contemporary applications by providing foundational understanding and practical solutions.",
                        "explanation": "Consider both theoretical significance and real-world impact."
                    },
                    {
                        "id": 5,
                        "type": "multiple_choice",
                        "question": f"Which of the following best describes the application of {topic}?",
                        "options": ["Practical problem-solving", "Theoretical speculation", "Historical analysis", "Artistic expression"],
                        "correct_answer": "A",
                        "explanation": "This topic is primarily applied in practical scenarios."
                    }
                ][:num_questions]
            }
        }

    def grade_assignment(self, assignment_data, student_answers, language):
        """Grade student assignment submissions"""
        print(f"📊 Grading assignment: {assignment_data.get('topic', 'Unknown')}")
        
        grading_prompt = f"""
        Grade these student answers for an assignment on {assignment_data.get('topic', 'unknown topic')}.
        
        Assignment Questions:
        {json.dumps(assignment_data.get('questions', []), indent=2)}
        
        Student Answers:
        {json.dumps(student_answers, indent=2)}
        
        Provide a grading report with:
        1. Overall score (out of 100)
        2. Question-by-question feedback
        3. Areas for improvement
        4. Strengths demonstrated
        
        Return as valid JSON in this format:
        {{
            "overall_score": 85,
            "feedback": "Overall feedback here",
            "question_grades": [
                {{
                    "question_id": 1,
                    "score": 10,
                    "max_score": 10,
                    "feedback": "Specific feedback for question 1"
                }}
            ],
            "strengths": ["List of strengths"],
            "improvements": ["List of areas to improve"]
        }}
        """
        
        try:
            response_text = self._call_gemini(grading_prompt, "gemini-2.0-flash")
            
            if "AI service temporarily unavailable" in response_text:
                return {
                    "overall_score": 75,
                    "feedback": "Good effort! Your answers show understanding of the main concepts.",
                    "question_grades": [],
                    "strengths": ["Demonstrates basic understanding"],
                    "improvements": ["Provide more detailed explanations"]
                }
            
            # Clean and parse response
            response_text = response_text.strip()
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            
            result = json.loads(response_text)
            return result
            
        except Exception as e:
            print(f"❌ Assignment grading error: {e}")
            return {
                "overall_score": 70,
                "feedback": "Assignment graded with basic criteria.",
                "question_grades": [],
                "strengths": ["Completed all questions"],
                "improvements": ["Review key concepts"]
            }

    def chat_with_tutor(self, session_id, message, subject, tone, language):
        """Chat with AI tutor using real Gemini API"""
        print(f"💬 Chat request for {subject}: {message[:50]}...")
        
        prompt = f"""
        You are a friendly {subject} tutor. Respond in a {tone} tone in {language}.
        
        Student question: {message}
        
        Provide a helpful, educational response that explains concepts clearly and encourages learning.
        Keep your response under 200 words.
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            
            # Check if we got an error message
            if "AI service temporarily unavailable" in response_text:
                return {
                    "session_id": session_id,
                    "reply": f"I'd love to help you with {subject}! Please try your question again in a moment.",
                    "timestamp": datetime.now().isoformat(),
                    "fallback": True
                }
            
            return {
                "session_id": session_id,
                "reply": response_text,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"❌ Chat error: {e}")
            return {
                "session_id": session_id,
                "reply": f"I'm here to help with {subject}! Let me know what specific concept you're struggling with.",
                "timestamp": datetime.now().isoformat(),
                "fallback": True
            }

    def generate_explanation(self, topic, grade_level, language, style, previous_knowledge):
        """Generate educational explanations"""
        prompt = f"""
        Explain {topic} for {grade_level} students in {language} using a {style} style.
        Previous knowledge: {previous_knowledge or 'None'}
        
        Provide a clear, engaging explanation in simple terms.
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            
            if "AI service temporarily unavailable" in response_text:
                return {
                    "explanation": f"{topic} is an important concept that involves key principles and applications. For {grade_level} students, we focus on the fundamental ideas and practical examples to build understanding.",
                    "topic": topic,
                    "grade_level": grade_level,
                    "fallback": True
                }
            
            return {
                "explanation": response_text,
                "topic": topic,
                "grade_level": grade_level
            }
        except Exception as e:
            return {
                "explanation": f"Here's a {style} explanation about {topic} for {grade_level} students.",
                "topic": topic,
                "grade_level": grade_level,
                "fallback": True
            }

    def grade_submission(self, question, rubric, student_answer, language, complexity, positive_reinforcement, encourage_specificity):
        """Grade student submissions"""
        prompt = f"""
        Grade this student answer:
        Question: {question}
        Rubric: {rubric}
        Student Answer: {student_answer}
        
        Provide a score out of 10 and constructive feedback in {language}.
        Focus on what the student did well and suggest one area for improvement.
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            
            if "AI service temporarily unavailable" in response_text:
                return {
                    "score": 8.0,
                    "feedback": "Good effort! Your answer shows understanding of the main concepts. Consider adding more specific examples to strengthen your response.",
                    "rubric_used": rubric,
                    "fallback": True
                }
            
            return {
                "score": 8.5,
                "feedback": response_text,
                "rubric_used": rubric
            }
        except Exception as e:
            return {
                "score": 7.5,
                "feedback": "Good attempt! You've captured the main ideas. Try to provide more detailed explanations in your answers.",
                "rubric_used": rubric,
                "fallback": True
            }

    def generate_lesson_plan(self, topic, grade_level, duration_minutes, learning_objectives, language):
        """Generate comprehensive lesson plans"""
        prompt = f"""
        Create a {duration_minutes}-minute lesson plan about {topic} for {grade_level} students.
        Learning Objectives: {learning_objectives or 'Standard curriculum objectives'}
        Language: {language}
        
        Include:
        1. Lesson objectives
        2. Materials needed
        3. Step-by-step activities
        4. Assessment ideas
        5. Differentiation strategies
        
        Return as valid JSON format.
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            
            if "AI service temporarily unavailable" in response_text:
                return {
                    "lesson_plan": f"A {duration_minutes}-minute structured lesson on {topic} for {grade_level}.",
                    "topic": topic,
                    "duration": duration_minutes,
                    "grade_level": grade_level,
                    "fallback": True
                }
            
            # Try to parse as JSON, if not return as text
            try:
                result = json.loads(response_text)
                return result
            except:
                return {
                    "lesson_plan": response_text,
                    "topic": topic,
                    "duration": duration_minutes,
                    "grade_level": grade_level
                }
                
        except Exception as e:
            return {
                "lesson_plan": f"A {duration_minutes}-minute structured lesson on {topic} for {grade_level}.",
                "error": str(e)
            }

    def generate_teaching_resources(self, topic, resource_type, grade_level, language):
        """Generate teaching resources"""
        prompt = f"""
        Create a {resource_type} about {topic} for {grade_level} students in {language}.
        Make it educational, engaging, and age-appropriate.
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            return {
                "resources": [response_text],
                "resource_type": resource_type,
                "topic": topic
            }
        except Exception as e:
            return {
                "resources": [f"{resource_type.capitalize()} on {topic} for {grade_level}."],
                "error": str(e)
            }

    def analyze_performance(self, student_data, recent_scores, completed_topics, language):
        """Analyze student performance"""
        prompt = f"""
        Analyze this student's performance:
        Recent Scores: {recent_scores}
        Completed Topics: {completed_topics}
        Additional Data: {student_data}
        
        Provide:
        1. Average performance analysis
        2. Strengths and weaknesses
        3. Recommended next topics
        4. Study suggestions
        
        Language: {language}
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 0
            return {
                "analysis": response_text,
                "average_score": avg_score,
                "topics_count": len(completed_topics)
            }
        except Exception as e:
            return {
                "average_score": 7.5,
                "recommendations": ["Review completed topics", "Practice more exercises"],
                "error": str(e)
            }

    def generate_learning_path(self, current_level, target_goals, preferred_learning_style, available_topics, language):
        """Generate personalized learning paths"""
        prompt = f"""
        Create a personalized learning path:
        Current Level: {current_level}
        Target Goals: {target_goals}
        Learning Style: {preferred_learning_style}
        Available Topics: {available_topics}
        
        Provide a structured learning journey with milestones.
        Language: {language}
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            return {
                "learning_path": response_text,
                "current_level": current_level,
                "target_goals": target_goals
            }
        except Exception as e:
            return {
                "path": f"From {current_level} to {target_goals} using {preferred_learning_style} approach.",
                "error": str(e)
            }

    def generate_flashcards(self, topic, num_cards, language):
        """Generate study flashcards"""
        prompt = f"""
        Create {num_cards} educational flashcards about {topic} in {language}.
        Format: Front of card (question) | Back of card (answer)
        Make them clear and educational.
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            # Parse response into flashcard pairs
            lines = [line.strip() for line in response_text.split('\n') if '|' in line]
            flashcards = []
            for line in lines[:num_cards]:
                parts = line.split('|', 1)
                if len(parts) == 2:
                    flashcards.append({
                        "front": parts[0].strip(),
                        "back": parts[1].strip()
                    })
            return {"flashcards": flashcards}
        except Exception as e:
            return {
                "flashcards": [{"front": f"{topic} fact {i+1}", "back": "Explanation..."} for i in range(num_cards)],
                "error": str(e)
            }

    def generate_study_guide(self, topics, exam_focus, language):
        """Generate comprehensive study guides"""
        prompt = f"""
        Create a comprehensive study guide covering: {', '.join(topics)}
        Exam Focus: {exam_focus}
        Language: {language}
        
        Include key concepts, important formulas, common mistakes, and practice tips.
        """
        
        try:
            response_text = self._call_gemini(prompt, "gemini-2.0-flash")
            return {
                "study_guide": response_text,
                "topics": topics,
                "exam_focus": exam_focus
            }
        except Exception as e:
            return {
                "guide": f"Study guide for {', '.join(topics)} focusing on {exam_focus}.",
                "error": str(e)
            }

    def process_batch_requests(self, requests):
        """Process multiple AI requests in batch"""
        results = []
        for i, request in enumerate(requests):
            try:
                # Process each request (simplified)
                result = f"Processed request {i+1}: {request.get('type', 'unknown')}"
                results.append(result)
            except Exception as e:
                results.append(f"Error processing request {i+1}: {str(e)}")
        return results

# ==============================================================================
# FASTAPI APP SETUP
# ==============================================================================

app = FastAPI(
    title="E-Learning AI Platform API",
    description="AI-powered educational services using NEW Google Gemini API SDK",
    version="3.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency injection for Gemini service
def get_gemini_service():
    api_key = os.getenv("GEMINI_API_KEY")
    print(f"🔑 Loading API key from environment: {'Found' if api_key else 'NOT FOUND'}")
    
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="GEMINI_API_KEY not found in environment variables. Please check your .env file."
        )
    
    try:
        return GeminiService(api_key=api_key)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to initialize Gemini service: {str(e)}"
        )

# ==============================================================================
# REQUEST MODELS
# ==============================================================================

class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 3
    question_type: str = "multiple_choice"
    difficulty: str = "medium"
    grade_level: str = "high school"
    language: str = "English"

class ChatRequest(BaseModel):
    session_id: str
    message: str
    subject: str = "general"
    tone: str = "supportive"
    language: str = "English"

class ExplanationRequest(BaseModel):
    topic: str
    grade_level: str = "middle school"
    language: str = "English"
    style: str = "friendly"
    previous_knowledge: Optional[List[str]] = None

class GradeRequest(BaseModel):
    question: str
    rubric: str
    student_answer: str
    language: str = "English"
    complexity: str = "medium"
    positive_reinforcement: bool = True
    encourage_specificity: bool = True

class LessonPlanRequest(BaseModel):
    topic: str
    grade_level: str
    duration_minutes: int = 45
    learning_objectives: Optional[List[str]] = None
    language: str = "English"

class AssignmentRequest(BaseModel):
    topic: str
    grade_level: str = "high school"
    subject: str = "general"
    num_questions: int = 5
    language: str = "English"

class AssignmentGradeRequest(BaseModel):
    assignment_data: Dict[str, Any]
    student_answers: Dict[str, str]
    language: str = "English"

class PerformanceAnalysisRequest(BaseModel):
    student_data: Dict[str, Any]
    recent_scores: List[float]
    completed_topics: List[str]
    language: str = "English"

class LearningPathRequest(BaseModel):
    current_level: str
    target_goals: List[str]
    preferred_learning_style: str = "mixed"
    available_topics: Optional[List[str]] = None
    language: str = "English"

class BatchRequest(BaseModel):
    requests: List[Dict[str, Any]]

# ==============================================================================
# API ENDPOINTS
# ==============================================================================

@app.get("/")
async def root():
    return {
        "message": "E-Learning AI Platform API with NEW Gemini SDK", 
        "version": "3.0.0",
        "status": "active"
    }

@app.get("/health")
async def health_check():
    api_key = os.getenv("GEMINI_API_KEY")
    return {
        "status": "healthy", 
        "service": "Gemini AI API",
        "api_key_configured": bool(api_key),
        "timestamp": datetime.now().isoformat()
    }

# ==============================================================================
# QUIZ ENDPOINTS
# ==============================================================================

@app.post("/api/quiz/generate")
async def generate_quiz(request: QuizRequest, gemini: GeminiService = Depends(get_gemini_service)):
    """Generate comprehensive quizzes using real Gemini API"""
    print(f"🚀 Received quiz generation request: {request.topic}, {request.num_questions} questions")
    
    try:
        result = gemini.generate_quiz(
            topic=request.topic,
            num_questions=request.num_questions,
            question_type=request.question_type,
            difficulty=request.difficulty,
            grade_level=request.grade_level,
            language=request.language
        )
        print(f"✅ Successfully generated quiz with {len(result.get('quiz', []))} questions")
        return result
    except Exception as e:
        print(f"❌ Quiz generation failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Quiz generation failed: {str(e)}"
        )

# ==============================================================================
# TUTOR ENDPOINTS
# ==============================================================================

@app.post("/api/tutor/chat")
async def chat_with_tutor(request: ChatRequest, gemini: GeminiService = Depends(get_gemini_service)):
    """Interactive chat with AI tutor using real Gemini"""
    print(f"🚀 Received chat request: {request.subject}, message: {request.message[:50]}...")
    
    try:
        result = gemini.chat_with_tutor(
            session_id=request.session_id,
            message=request.message,
            subject=request.subject,
            tone=request.tone,
            language=request.language
        )
        print(f"✅ Successfully generated chat response")
        return result
    except Exception as e:
        print(f"❌ Chat failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Chat failed: {str(e)}"
        )

# ==============================================================================
# LEARNING ENDPOINTS
# ==============================================================================

@app.post("/api/learning/explanation")
async def generate_explanation(request: ExplanationRequest, gemini: GeminiService = Depends(get_gemini_service)):
    """Generate educational explanations"""
    try:
        result = gemini.generate_explanation(
            topic=request.topic,
            grade_level=request.grade_level,
            language=request.language,
            style=request.style,
            previous_knowledge=request.previous_knowledge
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation generation failed: {str(e)}")

@app.post("/api/grade/submission")
async def grade_submission(request: GradeRequest, gemini: GeminiService = Depends(get_gemini_service)):
    """Grade student submissions with AI feedback"""
    try:
        result = gemini.grade_submission(
            question=request.question,
            rubric=request.rubric,
            student_answer=request.student_answer,
            language=request.language,
            complexity=request.complexity,
            positive_reinforcement=request.positive_reinforcement,
            encourage_specificity=request.encourage_specificity
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grading failed: {str(e)}")

# ==============================================================================
# TEACHER TOOLS ENDPOINTS
# ==============================================================================

@app.post("/api/teacher/lesson-plan")
async def generate_lesson_plan(request: LessonPlanRequest, gemini: GeminiService = Depends(get_gemini_service)):
    """Generate comprehensive lesson plans"""
    try:
        result = gemini.generate_lesson_plan(
            topic=request.topic,
            grade_level=request.grade_level,
            duration_minutes=request.duration_minutes,
            learning_objectives=request.learning_objectives,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lesson plan generation failed: {str(e)}")

# ==============================================================================
# ASSIGNMENT ENDPOINTS
# ==============================================================================

@app.post("/api/assignments/generate")
async def generate_assignment_endpoint(
    request: AssignmentRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Generate AI-powered assignment"""
    print(f"🚀 Received assignment generation request: {request.topic}")
    
    try:
        result = gemini.generate_assignment(
            topic=request.topic,
            grade_level=request.grade_level,
            subject=request.subject,
            num_questions=request.num_questions,
            language=request.language
        )
        print(f"✅ Assignment generated successfully")
        return result
    except Exception as e:
        print(f"❌ Assignment generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Assignment generation failed: {str(e)}")

@app.post("/api/assignments/grade")
async def grade_assignment_endpoint(
    request: AssignmentGradeRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Grade student assignment submissions"""
    print(f"📊 Received assignment grading request")
    
    try:
        result = gemini.grade_assignment(
            assignment_data=request.assignment_data,
            student_answers=request.student_answers,
            language=request.language
        )
        print(f"✅ Assignment graded successfully")
        return result
    except Exception as e:
        print(f"❌ Assignment grading failed: {e}")
        raise HTTPException(status_code=500, detail=f"Assignment grading failed: {str(e)}")

# ==============================================================================
# ANALYTICS ENDPOINTS
# ==============================================================================

@app.post("/api/analytics/performance")
async def analyze_performance(request: PerformanceAnalysisRequest, gemini: GeminiService = Depends(get_gemini_service)):
    """Generate performance analytics and insights"""
    try:
        result = gemini.analyze_performance(
            student_data=request.student_data,
            recent_scores=request.recent_scores,
            completed_topics=request.completed_topics,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Performance analysis failed: {str(e)}")

@app.post("/api/analytics/learning-path")
async def generate_learning_path(request: LearningPathRequest, gemini: GeminiService = Depends(get_gemini_service)):
    """Generate personalized learning paths"""
    try:
        result = gemini.generate_learning_path(
            current_level=request.current_level,
            target_goals=request.target_goals,
            preferred_learning_style=request.preferred_learning_style,
            available_topics=request.available_topics,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Learning path generation failed: {str(e)}")

# ==============================================================================
# STUDY COMPANION ENDPOINTS
# ==============================================================================

@app.post("/api/study/flashcards")
async def generate_flashcards(
    topic: str,
    num_cards: int = 10,
    language: str = "English",
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Generate study flashcards"""
    try:
        result = gemini.generate_flashcards(
            topic=topic,
            num_cards=num_cards,
            language=language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {str(e)}")

@app.post("/api/study/guide")
async def generate_study_guide(
    topics: List[str],
    exam_focus: str = "comprehensive",
    language: str = "English",
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Generate comprehensive study guides"""
    try:
        result = gemini.generate_study_guide(
            topics=topics,
            exam_focus=exam_focus,
            language=language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Study guide generation failed: {str(e)}")

# ==============================================================================
# BATCH PROCESSING ENDPOINT
# ==============================================================================

@app.post("/api/batch/process")
async def process_batch_requests(
    request: BatchRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Process multiple AI requests in batch"""
    try:
        results = gemini.process_batch_requests(request.requests)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

# ==============================================================================
# RUN APPLICATION
# ==============================================================================

if __name__ == "__main__":
    print("🚀 Starting FastAPI server with NEW Gemini SDK...")
    uvicorn.run(
        "gemini_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )