"""
FastAPI application for E-Learning Platform AI Services
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn

from gemini_service import GeminiService, ModuleType

# Initialize FastAPI app
app = FastAPI(
    title="E-Learning AI Platform API",
    description="AI-powered educational services using Google Gemini",
    version="2.0.0"
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
    # In production, get API key from environment variables
    import os
    api_key = os.getenv("GEMINI_API_KEY", "your-api-key-here")
    return GeminiService(api_key=api_key)


# Pydantic models for request/response
class GradeRequest(BaseModel):
    question: str
    rubric: str
    student_answer: str
    language: str = "English"
    complexity: str = "medium"
    positive_reinforcement: bool = True
    encourage_specificity: bool = True

class ExplanationRequest(BaseModel):
    topic: str
    grade_level: str = "middle school"
    language: str = "English"
    style: str = "friendly"
    previous_knowledge: Optional[List[str]] = None

class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 5
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

class LessonPlanRequest(BaseModel):
    topic: str
    grade_level: str
    duration_minutes: int = 45
    learning_objectives: Optional[List[str]] = None
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
    return {"message": "E-Learning AI Platform API", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Gemini AI API"}

# ==============================================================================
# ASSESSMENT ENDPOINTS
# ==============================================================================

@app.post("/api/grade/submission")
async def grade_submission(
    request: GradeRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Grade a student submission with detailed feedback"""
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
# STUDENT LEARNING ENDPOINTS
# ==============================================================================

@app.post("/api/learning/explanation")
async def generate_explanation(
    request: ExplanationRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Generate educational explanations for students"""
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

@app.post("/api/learning/summary")
async def generate_summary(
    content: str,
    bullet_points: int = 5,
    language: str = "English",
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Generate study summaries from content"""
    try:
        result = gemini.generate_summary(
            content=content,
            bullet_points=bullet_points,
            language=language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

# ==============================================================================
# QUIZ GENERATION ENDPOINTS
# ==============================================================================

@app.post("/api/quiz/generate")
async def generate_quiz(
    request: QuizRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Generate comprehensive quizzes"""
    try:
        result = gemini.generate_quiz(
            topic=request.topic,
            num_questions=request.num_questions,
            question_type=request.question_type,
            difficulty=request.difficulty,
            grade_level=request.grade_level,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

# ==============================================================================
# VIRTUAL TUTOR ENDPOINTS
# ==============================================================================

@app.post("/api/tutor/chat")
async def chat_with_tutor(
    request: ChatRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Interactive chat with virtual tutor"""
    try:
        result = gemini.chat_with_tutor(
            session_id=request.session_id,
            message=request.message,
            subject=request.subject,
            tone=request.tone,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/api/tutor/session/{session_id}")
async def start_tutor_session(
    session_id: str,
    context: Optional[Dict[str, Any]] = None,
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Start a new tutor session"""
    try:
        gemini.start_chat_session(session_id, context)
        return {"status": "session_created", "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(e)}")

# ==============================================================================
# TEACHER TOOLS ENDPOINTS
# ==============================================================================

@app.post("/api/teacher/lesson-plan")
async def generate_lesson_plan(
    request: LessonPlanRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
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

@app.post("/api/teacher/resources")
async def generate_teaching_resources(
    topic: str,
    resource_type: str = "worksheet",
    grade_level: str = "middle school",
    language: str = "English",
    gemini: GeminiService = Depends(get_gemini_service)
):
    """Generate teaching resources"""
    try:
        result = gemini.generate_teaching_resources(
            topic=topic,
            resource_type=resource_type,
            grade_level=grade_level,
            language=language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resource generation failed: {str(e)}")

# ==============================================================================
# ANALYTICS ENDPOINTS
# ==============================================================================

@app.post("/api/analytics/performance")
async def analyze_performance(
    request: PerformanceAnalysisRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
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
async def generate_learning_path(
    request: LearningPathRequest,
    gemini: GeminiService = Depends(get_gemini_service)
):
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
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )