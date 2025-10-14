"""
gemini_service.py
~~~~~~~~~~~~~~~~~~~

This module implements a Python service layer for interacting with Google’s
Gemini generative AI models.  It encapsulates prompt construction,
rate‑limited HTTP requests and high‑level grading routines tailored for
educational use cases such as automated assignment scoring and feedback.

Key features:

* **Prompt formatting** – Student submissions are combined with the original
  question and a rubric or model answer into a structured prompt that
  encourages the AI to return both a numeric score and qualitative feedback.

* **Rate limiting** – Calls to the Gemini API are throttled to respect
  configurable per‑minute limits.  A simple token bucket mechanism is
  implemented using timestamps and a mutex so that concurrent threads
  cooperate correctly.

* **Batch grading** – A convenient batch method uses a thread pool to
  process multiple submissions in parallel while still obeying the global
  rate limit.  This is useful when an entire class submits at once.

* **Graceful error handling** – Network and API errors are caught and
  returned to the caller in a structured form so that the calling
  application can surface useful messages to end‑users or retry if
  appropriate.

This file is written to be self‑contained and does not rely on any
external frameworks.  It requires the `requests` library which is
commonly available in most Python environments.  If `requests` is not
installed, install it via pip (`pip install requests`) or replace
usage with Python’s built‑in `urllib` modules.

Example usage:

>>> from gemini_service import GeminiService
>>> service = GeminiService(api_key='YOUR_API_KEY_HERE')
>>> result = service.grade(
...     question="Explain the theory of relativity.",
...     rubric="A correct answer mentions spacetime, the equivalence of mass and energy (E=mc^2), and the speed of light as the ultimate speed limit.",
...     student_answer="It’s about how time and space are linked and how energy relates to mass."
... )
>>> print(result)
{'score': 0.7, 'feedback': 'The answer touches on spacetime and mass‑energy but omits the speed of light and other details.'}

"""

from __future__ import annotations

import json
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional

try:
    import requests
except ImportError as exc:  # pragma: no cover
    raise RuntimeError(
        "The requests library is required for GeminiService. Please install it with 'pip install requests'."
    ) from exc


class GeminiService:
    """A service wrapper for Google Gemini generative models.

    Parameters
    ----------
    api_key : str
        Your Google generative language API key.  This should be kept
        secret and loaded from environment variables or a secure
        configuration store in production.
    model_name : str, optional
        The model to call.  Defaults to 'models/gemini-pro'.  You
        can select other models (e.g. 'models/gemini-pro-vision') if
        enabled for your API key.
    rate_limit_per_minute : int, optional
        The maximum number of requests allowed per minute.  The
        service enforces this limit across all threads to prevent
        hitting Google’s API rate caps.  Defaults to 60.

    Notes
    -----
    Google’s API may impose additional limits beyond the per‑minute
    rate (such as per‑day quotas).  Adjust the `rate_limit_per_minute`
    argument according to your contract.  This implementation uses a
    simple time‑based delay; for more advanced production systems you
    may want to integrate with a full‐featured rate limiting library or
    queueing system.
    """

    API_ENDPOINT_TEMPLATE = (
        "https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={api_key}"
    )

    def __init__(
        self,
        api_key: str,
        model_name: str = "models/gemini-pro",
        rate_limit_per_minute: int = 60,
    ) -> None:
        if not api_key:
            raise ValueError("API key must be provided.")
        if rate_limit_per_minute <= 0:
            raise ValueError("Rate limit must be a positive integer.")

        self.api_key = api_key
        self.model_name = model_name
        # Minimum interval in seconds between requests
        self._min_interval = 60.0 / float(rate_limit_per_minute)
        # Timestamp of the last API call
        self._last_request_time = 0.0
        # Mutex to protect shared state across threads
        self._lock = threading.Lock()

    def _throttle(self) -> None:
        """Ensure that requests are sent no faster than the configured rate.

        This method blocks until sufficient time has passed since the
        previous request.  It uses a mutex to ensure that multiple
        threads respect the global rate limit.
        """
        with self._lock:
            now = time.perf_counter()
            elapsed = now - self._last_request_time
            wait_time = self._min_interval - elapsed
            if wait_time > 0:
                time.sleep(wait_time)
                self._last_request_time = time.perf_counter()
            else:
                self._last_request_time = now

    def _build_prompt(
        self,
        question: str,
        rubric: str,
        student_answer: str,
        *,
        language: str = "English",
        positive_reinforcement: bool = True,
        encourage_specificity: bool = True,
        complexity: Optional[str] = None,
    ) -> str:
        """Construct a structured prompt for grading with enhanced feedback options.

        This helper builds a prompt that instructs the Gemini model to act
        as a constructive and supportive educator.  It asks for a numeric
        score in the range [0, 1] and natural language feedback that
        highlights what the student did well, pinpoints specific areas for
        improvement and encourages further study.  The prompt can be
        tailored for different languages and response lengths.

        Parameters
        ----------
        question : str
            The assignment question presented to the student.
        rubric : str
            A concise rubric or model answer describing expected points.
        student_answer : str
            The student’s response.
        language : str, optional
            The desired language of the feedback (default 'English').
        positive_reinforcement : bool, optional
            If True (default), instruct the model to always include at
            least one positive comment before suggesting improvements.
        encourage_specificity : bool, optional
            If True (default), the model will be prompted to refer to
            specific elements of the student’s answer when possible.
        complexity : str, optional
            A hint about the expected length of feedback.  Accepts
            values like 'short', 'medium' or 'long'.  If provided, the
            prompt will ask the model to tailor the feedback accordingly.

        Returns
        -------
        str
            A formatted prompt for submission to the Gemini API.
        """
        # Base instructions for the model
        instructions = [
            "You are an AI educational assistant. Grade the student's answer based on the question and rubric provided.",
            "Provide a JSON object with two fields: 'score' (a number between 0 and 1) and 'feedback' (a natural language explanation).",
            "The tone of the feedback must be constructive and supportive; avoid harsh language.",
        ]
        if positive_reinforcement:
            instructions.append(
                "Always begin the feedback by mentioning something the student did well, even if minor."
            )
        if encourage_specificity:
            instructions.append(
                "Refer to specific parts of the student's answer when highlighting strengths or areas for improvement."
            )
        if complexity:
            # Map user friendly hints to more explicit instructions
            length_map = {
                "short": "Provide feedback in 1–2 sentences.",
                "medium": "Provide feedback in 3–5 sentences.",
                "long": "Provide a detailed paragraph of feedback."
            }
            instructions.append(length_map.get(complexity, ""))
        # Language directive
        if language and language.lower() != "english":
            instructions.append(
                f"Write the feedback in {language}."
            )
        # Combine all instructions into a single block
        instructions_text = " ".join(filter(None, instructions))
        # Build the full prompt with delimiters to clearly separate sections
        prompt = (
            f"{instructions_text}\n\n"
            f"Question:\n{question}\n\n"
            f"Student Answer:\n{student_answer}\n\n"
            f"Rubric or Model Answer:\n{rubric}\n\n"
            "Respond ONLY with a JSON object containing 'score' and 'feedback'."
        )
        return prompt

    def _send_request(self, prompt: str) -> Dict[str, Any]:
        """Perform the HTTP POST request to the Gemini API and parse the response.

        Parameters
        ----------
        prompt : str
            The text prompt to submit to Gemini.

        Returns
        -------
        dict
            A dictionary representing the parsed JSON reply from the
            model.  If the model’s response is not valid JSON or an
            error occurs, an error entry is returned instead.
        """
        # Perform the global throttle before each call
        self._throttle()

        url = self.API_ENDPOINT_TEMPLATE.format(
            model_name=self.model_name, api_key=self.api_key
        )
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ]
        }
        headers = {
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
        except requests.RequestException as ex:
            # Network error or HTTP error
            return {
                "error": True,
                "message": f"Request to Gemini API failed: {ex}"
            }

        try:
            data = response.json()
        except json.JSONDecodeError:
            return {
                "error": True,
                "message": "Failed to decode JSON response from Gemini API."
            }

        # Gemini responses include a list of 'candidates' with content parts.
        # We attempt to parse the first candidate's text as JSON.
        try:
            candidates = data.get("candidates", [])
            if not candidates:
                raise KeyError("No candidates returned in response.")
            raw_text = candidates[0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_text)
            # Ensure score is a float between 0 and 1
            score = float(parsed.get("score", 0))
            score = max(0.0, min(1.0, score))
            feedback = str(parsed.get("feedback", ""))
            return {
                "score": score,
                "feedback": feedback,
                "raw": parsed
            }
        except Exception as ex:
            # If anything goes wrong during parsing, return the raw model text
            return {
                "error": False,
                "score": None,
                "feedback": None,
                "raw": data,
                "message": f"Unable to parse model output as JSON: {ex}"
            }

    def grade(
        self,
        question: str,
        rubric: str,
        student_answer: str,
        *,
        language: str = "English",
        complexity: Optional[str] = None,
        positive_reinforcement: bool = True,
        encourage_specificity: bool = True,
    ) -> Dict[str, Any]:
        """Grade a single student submission synchronously.

        This method constructs an appropriate prompt, sends it to the
        Gemini API and returns a dictionary containing the normalized
        score (0–1) and textual feedback.  Errors are reported via
        `error` and `message` keys in the returned dict.

        Parameters
        ----------
        question : str
            The assignment question.
        rubric : str
            A short rubric or model answer.
        student_answer : str
            The response from the student.

        Returns
        -------
        dict
            A mapping with keys `score`, `feedback` and optionally
            `error`/`message` if something went wrong.  The key `raw`
            contains the unmodified API response or parsed JSON from the
            model for debugging purposes.
        """
        # Build a prompt with optional tailoring parameters.  This allows
        # clients to specify the feedback language, length and tone.
        prompt = self._build_prompt(
            question,
            rubric,
            student_answer,
            language=language,
            positive_reinforcement=positive_reinforcement,
            encourage_specificity=encourage_specificity,
            complexity=complexity,
        )
        result = self._send_request(prompt)
        # If no meaningful feedback is returned (score is None and no error),
        # provide a gentle default message as per REQ‑FR‑5.
        if not result.get("error") and result.get("score") is None:
            result.setdefault("message", "No answer was provided or the AI could not generate feedback.")
        return result

    def grade_batch(self, submissions: List[Dict[str, str]], max_workers: Optional[int] = None) -> List[Dict[str, Any]]:
        """Grade multiple submissions concurrently while respecting rate limits.

        Parameters
        ----------
        submissions : list of dict
            Each item must be a dict with keys 'question', 'rubric' and
            'student_answer'.  Missing keys will raise a ValueError.
        max_workers : int, optional
            The maximum number of threads to use.  Defaults to the
            number of submissions or the number of CPUs if larger.

        Returns
        -------
        list of dict
            A list of result dictionaries in the same order as the
            input submissions.  Each result dictionary has the same
            structure as returned by :meth:`grade`.
        """
        results: List[Optional[Dict[str, Any]]] = [None] * len(submissions)

        def worker(index: int, item: Dict[str, str]) -> None:
            # Validate input keys
            if not all(k in item for k in ("question", "rubric", "student_answer")):
                results[index] = {
                    "error": True,
                    "message": f"Submission at index {index} is missing required keys."
                }
                return
            results[index] = self.grade(
                item["question"], item["rubric"], item["student_answer"]
            )

        # Determine the number of worker threads to use
        if max_workers is None:
            # Use a conservative number of workers to avoid oversubscribing
            # the CPU and to respect the per‑minute rate limit.  At most one
            # request will be issued per _min_interval, so more than a
            # handful of threads is rarely beneficial.
            max_workers = min(4, len(submissions)) if len(submissions) > 0 else 1

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for idx, submission in enumerate(submissions):
                futures.append(executor.submit(worker, idx, submission))
            # Wait for all futures to complete
            for future in as_completed(futures):
                # Exceptions raised within worker threads will surface here
                future.result()

        # All results should now be filled
        return results

    # ------------------------------------------------------------------
    # Adaptive learning and teacher assistant features
    # ------------------------------------------------------------------
    def recommend_next_topic(
        self,
        performance_data: Dict[str, float],
        *,
        syllabus: Optional[List[str]] = None,
        language: str = "English",
    ) -> Dict[str, Any]:
        """Generate an adaptive learning recommendation based on performance.

        This method analyses a student's performance across topics and
        recommends the next topic to study.  It leverages the Gemini
        model to provide personalised guidance as described in
        REQ‑AR‑2 and REQ‑AR‑3.

        Parameters
        ----------
        performance_data : dict
            Mapping of topic names to a numeric score (0–1 or 0–100) representing
            the student’s proficiency.  Lower scores indicate weaker areas.
        syllabus : list of str, optional
            A list of valid topics the recommendation should be drawn from.  If
            provided, the model is instructed to choose only from this list.
        language : str, optional
            Desired language of the recommendation.  Defaults to English.

        Returns
        -------
        dict
            A dictionary with keys 'topic' and 'reason', or an 'error'
            if the operation failed.  The raw AI response is included in
            the 'raw' key for debugging.
        """
        if not performance_data:
            return {
                "error": True,
                "message": "Performance data is required to generate a recommendation."
            }
        # Construct a readable summary of performance for the prompt
        performance_lines = []
        for topic, score in performance_data.items():
            try:
                percent = float(score) * 100 if float(score) <= 1.0 else float(score)
            except Exception:
                percent = 0.0
            performance_lines.append(f"{topic}: {percent:.1f}%")
        performance_text = "; ".join(performance_lines)
        syllabus_text = (
            f"The following topics are available in the syllabus: {', '.join(syllabus)}. "
            if syllabus
            else ""
        )
        prompt = (
            "You are an AI tutor that suggests what topic a student should study next based on their recent performance. "
            "The student's scores per topic are: "
            f"{performance_text}. "
            f"{syllabus_text}"
            "Recommend one primary topic for the student to focus on next and briefly explain why. "
            "Return your answer as a JSON object with 'topic' and 'reason' fields."
        )
        if language and language.lower() != "english":
            prompt += f" Write the answer in {language}."
        result = self._send_request(prompt)
        # Attempt to parse the JSON from the model output as done in _send_request
        # If parsing fails the caller can inspect 'raw' for details
        try:
            # The _send_request method attempts to parse JSON from the model and
            # returns a dict with 'score' and 'feedback'.  For recommendation
            # prompts we expect a different shape.  So we reparse here.
            raw = result.get("raw")
            if isinstance(raw, dict) and not result.get("error"):
                # raw could either be the parsed JSON from the model or the
                # entire API response.  We try to extract a JSON string if
                # present.  If raw has 'topic' key we assume it's already parsed.
                if "topic" in raw and "reason" in raw:
                    return raw
        except Exception:
            pass
        # If we couldn't parse structured fields, return the result as is
        return result

    def generate_quiz(
        self,
        topic: str,
        *,
        num_questions: int = 5,
        question_type: str = "short answer",
        grade_level: Optional[str] = None,
        language: str = "English",
    ) -> Dict[str, Any]:
        """Generate quiz questions using the AI for a given topic.

        This method helps teachers create content as per REQ‑TA‑1 and
        REQ‑TA‑6.  It sends a prompt to the Gemini API requesting a
        numbered list of questions along with answers in JSON format.

        Parameters
        ----------
        topic : str
            The subject or concept the quiz should cover.
        num_questions : int, optional
            How many questions to generate.  Defaults to 5.
        question_type : str, optional
            The style of questions, e.g. "multiple choice", "short answer", "true/false".
        grade_level : str, optional
            The educational level of the questions (e.g., "5th grade").  If provided,
            included in the prompt to ensure appropriate difficulty.
        language : str, optional
            Language of the generated questions and answers.

        Returns
        -------
        dict
            Contains a list of question/answer pairs under the key
            'questions', or an 'error' message on failure.  The raw AI
            response is provided in 'raw'.
        """
        if not topic:
            return {
                "error": True,
                "message": "Topic is required to generate quiz questions."
            }
        grade_clause = f" for {grade_level}" if grade_level else ""
        prompt = (
            "You are an AI assistant for teachers. "
            f"Generate {num_questions} {question_type} questions about {topic}{grade_clause}. "
            "For each question include a correct answer. "
            "Return the result as a JSON array of objects with 'question' and 'answer' fields."
        )
        if language and language.lower() != "english":
            prompt += f" Write the questions and answers in {language}."
        result = self._send_request(prompt)
        # Attempt to parse the AI output as a list of Q/A
        try:
            raw = result.get("raw")
            if isinstance(raw, list):
                return {"questions": raw}
            # If raw is a dict, maybe it contains a 'questions' key
            if isinstance(raw, dict) and "questions" in raw:
                return {"questions": raw["questions"]}
        except Exception:
            pass
        # Fallback: return whatever the AI returned
        return result

    def summarize_feedback_for_parents(
        self,
        feedback: str,
        *,
        language: str = "English",
    ) -> Dict[str, Any]:
        """Summarize detailed feedback into a parent‑friendly overview.

        In situations where feedback is lengthy or technical,
        parents may appreciate a concise summary.  This method sends
        the full feedback to the AI and requests a short summary.

        Parameters
        ----------
        feedback : str
            The full feedback text returned from the AI.
        language : str, optional
            Desired language of the summary.  Defaults to English.

        Returns
        -------
        dict
            Contains a 'summary' field with the shorter version of the
            feedback, or an 'error' message if summarization fails.
        """
        if not feedback:
            return {
                "error": True,
                "message": "Feedback text is required for summarization."
            }
        prompt = (
            "You are an AI summarizer for parent communications. "
            "Rewrite the following feedback into a concise summary that is easy for parents to understand. "
            f"Feedback: {feedback}"\
            "\nReturn only a JSON object with a 'summary' field."
        )
        if language and language.lower() != "english":
            prompt += f" Write the summary in {language}."
        result = self._send_request(prompt)
        # Attempt to parse summary
        try:
            raw = result.get("raw")
            if isinstance(raw, dict) and "summary" in raw:
                return {"summary": raw["summary"]}
        except Exception:
            pass
        return result

    def assess_feedback_quality(
        self,
        feedback: str,
        *,
        language: str = "English",
    ) -> Dict[str, Any]:
        """Evaluate qualitative aspects of feedback for analytics.

        This method asks the AI to classify feedback along several
        dimensions: whether it contains positive reinforcement,
        specific references, and a supportive tone.  It returns a
        dictionary of boolean flags.  This fulfils REQ‑FR‑13 which
        requires storing metadata about feedback quality.

        Parameters
        ----------
        feedback : str
            The feedback text to analyse.
        language : str, optional
            Language of the analysis output.  Defaults to English.

        Returns
        -------
        dict
            A dictionary with flags 'positive_reinforcement',
            'specificity', 'supportive_tone', and possibly others.  If
            analysis fails, an error entry is returned.
        """
        if not feedback:
            return {
                "error": True,
                "message": "Feedback text is required for quality assessment."
            }
        prompt = (
            "You are an AI evaluator that rates the quality of educational feedback. "
            "Analyse the following feedback and answer whether it meets these criteria: "
            "1) Contains positive reinforcement? (true/false) "
            "2) References specific parts of the student's work? (true/false) "
            "3) Uses a supportive tone without harsh language? (true/false). "
            f"Feedback: {feedback}\n"
            "Return a JSON object with keys 'positive_reinforcement', 'specificity', and 'supportive_tone' and boolean values."
        )
        if language and language.lower() != "english":
            prompt += f" Provide your JSON in {language}."
        result = self._send_request(prompt)
        # Parse into expected flags
        try:
            raw = result.get("raw")
            if isinstance(raw, dict):
                # We assume flags exist directly
                return {
                    "positive_reinforcement": bool(raw.get("positive_reinforcement")),
                    "specificity": bool(raw.get("specificity")),
                    "supportive_tone": bool(raw.get("supportive_tone")),
                    "raw": raw,
                }
        except Exception:
            pass
        return result


__all__ = ["GeminiService"]