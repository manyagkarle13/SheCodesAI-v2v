import datetime
import requests
from collections import defaultdict
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    UserRegisterSerializer, MyTokenObtainPairSerializer, SymptomLogSerializer,
    ChatSessionSerializer, ChatMessageSerializer, DoctorSummaryReportSerializer,
    WorkplaceLetterSerializer
)
from .models import SymptomLog, ChatSession, ChatMessage, DoctorSummaryReport, WorkplaceLetter

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Simple API health check endpoint.
    """
    return Response({
        "status": "ok",
        "message": "SakhiPause API is running successfully. Version 2."
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user.
    """
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
        except Exception as e:
            import traceback
            return Response({
                "status": "error",
                "message": "Database/Save error occurred.",
                "error_detail": str(e),
                "traceback": traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({
            "status": "success",
            "message": "User registered successfully.",
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "email": user.email,
                "age": user.age
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_symptom(request):
    """
    Log user symptoms.
    """
    serializer = SymptomLogSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response({
            "status": "success",
            "message": "Symptoms logged successfully.",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response({
        "status": "error",
        "message": "Please check your inputs and try again.",
        "errors": serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_symptom_log(request):
    """
    Update today's existing symptom log (partial update).
    """
    today = datetime.date.today()
    try:
        log = SymptomLog.objects.get(user=request.user, date=today)
    except SymptomLog.DoesNotExist:
        return Response({
            "status": "error",
            "message": "No log found for today. Please create a new log first."
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = SymptomLogSerializer(log, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            "status": "success",
            "message": "Today's log updated successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    return Response({
        "status": "error",
        "message": "Could not update the log. Please check your inputs.",
        "errors": serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_symptom_history(request):
    """
    Get user symptom history.
    """
    logs = SymptomLog.objects.filter(user=request.user)
    serializer = SymptomLogSerializer(logs, many=True)
    return Response({
        "status": "success",
        "history": serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mrs_score(request):
    """
    Analyze the user's latest MRS score, classification, and trend comparison.
    """
    logs = SymptomLog.objects.filter(user=request.user).order_by('-date')[:2]
    
    if not logs.exists():
        return Response({
            "status": "error",
            "message": "No logs recorded yet."
        }, status=status.HTTP_404_NOT_FOUND)
        
    latest = logs[0]
    trend_data = {
        "difference": 0,
        "direction": "stable",
        "message": "No prior log available"
    }
    
    if len(logs) > 1:
        prev = logs[1]
        diff = latest.total_mrs_score - prev.total_mrs_score
        direction = "stable"
        if diff > 0:
            direction = "worsening"
            msg = f"+{diff} points since last entry"
        elif diff < 0:
            direction = "improving"
            msg = f"{diff} points since last entry"
        else:
            msg = "Stable since last entry"
            
        trend_data = {
            "difference": diff,
            "direction": direction,
            "message": msg
        }
        
    return Response({
        "status": "success",
        "latest_score": latest.total_mrs_score,
        "classification": latest.mrs_classification,
        "latest_log": SymptomLogSerializer(latest).data,
        "trend": trend_data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_symptom_trends(request):
    """
    Calculate weekly averages of symptoms and MRS scores for charts.
    """
    logs = SymptomLog.objects.filter(user=request.user).order_by('date')
    
    weekly_data = defaultdict(list)
    for log in logs:
        # Group by Monday of the log's week
        week_start = log.date - datetime.timedelta(days=log.date.weekday())
        weekly_data[week_start].append(log)
        
    trends_grouped = []
    for week_start, week_logs in sorted(weekly_data.items()):
        n = len(week_logs)
        trends_grouped.append({
            "week": week_start.strftime("%b %d, %Y"),
            "avg_score": round(sum(l.total_mrs_score for l in week_logs) / n, 1),
            "hot_flashes": round(sum(l.hot_flashes_severity for l in week_logs) / n, 1),
            "sleep_problems": round(sum(l.sleep_problems_severity for l in week_logs) / n, 1),
            "mood": round(sum(l.mood_severity for l in week_logs) / n, 1),
            "anxiety": round(sum(l.anxiety_severity for l in week_logs) / n, 1),
            "physical_exhaustion": round(sum(l.physical_exhaustion_severity for l in week_logs) / n, 1),
            "joint_muscle_pain": round(sum(l.joint_muscle_pain_severity for l in week_logs) / n, 1),
        })
        
    return Response({
        "status": "success",
        "trends": trends_grouped
    }, status=status.HTTP_200_OK)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def chat_sessions(request):
    """
    GET: List all chat sessions for the current user.
    POST: Create a new chat session.
    """
    if request.method == 'GET':
        sessions = ChatSession.objects.filter(user=request.user)
        serializer = ChatSessionSerializer(sessions, many=True)
        return Response({"status": "success", "sessions": serializer.data}, status=status.HTTP_200_OK)

    # POST — create a new session
    title = request.data.get('title', 'New Chat')[:80]
    session = ChatSession.objects.create(user=request.user, title=title)
    # Save opening assistant greeting as first message
    greeting = (
        "Hello! I'm Sakhi, your perimenopause and menopause AI companion. "
        "How can I support you today? You can ask me about tracking metrics, "
        "managing hot flashes, sleep tips, or workplace communication templates. "
        "Remember, I am an educational guide, not a doctor."
    )
    ChatMessage.objects.create(session=session, role='assistant', content=greeting)
    serializer = ChatSessionSerializer(session)
    return Response({"status": "success", "session": serializer.data}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_session_messages(request, session_id):
    """
    GET: Return all messages for a session (user must own it).
    """
    try:
        session = ChatSession.objects.get(id=session_id, user=request.user)
    except ChatSession.DoesNotExist:
        return Response({"status": "error", "message": "Chat session not found."}, status=status.HTTP_404_NOT_FOUND)
    messages = session.messages.all()
    serializer = ChatMessageSerializer(messages, many=True)
    return Response({"status": "success", "messages": serializer.data, "title": session.title}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_chat_session(request, session_id):
    """
    DELETE: Delete a chat session and all its messages.
    """
    try:
        session = ChatSession.objects.get(id=session_id, user=request.user)
    except ChatSession.DoesNotExist:
        return Response({"status": "error", "message": "Chat session not found."}, status=status.HTTP_404_NOT_FOUND)
    
    session.delete()
    return Response({"status": "success", "message": "Chat session deleted successfully."}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ask_ai(request):
    """
    Send a message to the Groq LLM. Persists the exchange to a session.
    Accepts: { session_id, messages: [{role, content}] }
    """
    messages = request.data.get('messages', [])
    session_id = request.data.get('session_id')
    question = request.data.get('question', '')

    if not messages and question:
        messages = [{"role": "user", "content": question}]

    if not messages:
        return Response({
            "status": "error",
            "message": "Please type a message before sending."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Resolve or create session
    session = None
    if session_id:
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            pass

    if not session:
        first_content = messages[0].get('content', 'New Chat') if messages else 'New Chat'
        title = first_content[:60]
        session = ChatSession.objects.create(user=request.user, title=title)
        # Add greeting as first message if session is brand new
        greeting = (
            "Hello! I'm Sakhi, your perimenopause and menopause AI companion. "
            "How can I support you today? You can ask me about tracking metrics, "
            "managing hot flashes, sleep tips, or workplace communication templates. "
            "Remember, I am an educational guide, not a doctor."
        )
        ChatMessage.objects.create(session=session, role='assistant', content=greeting)

    api_key = getattr(settings, 'GROQ_API_KEY', '')
    if not api_key:
        return Response({
            "status": "error",
            "message": "AI service is not configured on the server."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    system_prompt = (
        "You are a supportive, knowledgeable menopause health assistant. "
        "Explain things in simple, plain, and highly concise language. Never diagnose. "
        "Keep responses brief, clean, and easy to read. Use short paragraphs. "
        "Limit answers to a maximum of 2 short paragraphs or a list of bullet points (maximum 150 words total). "
        "If listing items, always output each list item on a new line starting with a bullet character '-'. "
        "Always encourage consulting a real doctor for serious concerns. Be warm and reassuring."
    )

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers_req = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "system", "content": system_prompt}] + messages
    }

    try:
        response = requests.post(url, json=payload, headers=headers_req, timeout=30)
        response.raise_for_status()
        data = response.json()
        ai_message = data['choices'][0]['message']
        ai_content = ai_message['content']

        # Persist the last user message and AI response
        last_user_msg = next((m for m in reversed(messages) if m.get('role') == 'user'), None)
        if last_user_msg:
            ChatMessage.objects.create(session=session, role='user', content=last_user_msg['content'])
        ChatMessage.objects.create(session=session, role='assistant', content=ai_content)
        # Update session timestamp and title if first real message
        if session.messages.count() <= 3 and last_user_msg:
            session.title = last_user_msg['content'][:60]
        session.save()

        return Response({
            "status": "success",
            "message": ai_content,
            "role": ai_message['role'],
            "session_id": session.id
        }, status=status.HTTP_200_OK)
    except requests.exceptions.RequestException as e:
        return Response({
            "status": "error",
            "message": "Sakhi AI is temporarily unavailable. Please try again in a moment."
        }, status=status.HTTP_502_BAD_GATEWAY)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_doctor_summary(request):
    """
    Generate a clinical 30-day symptom summary for doctor visits.
    """
    # 1. Fetch user logs from the last 30 days
    start_date = datetime.date.today() - datetime.timedelta(days=30)
    logs = SymptomLog.objects.filter(user=request.user, date__gte=start_date).order_by('date')
    
    total_logs = len(logs)
    if total_logs == 0:
        return Response({
            "status": "error",
            "message": "No symptom logs found from the last 30 days. Please record logs first to generate a summary."
        }, status=status.HTTP_404_NOT_FOUND)
        
    # 2. Calculate average MRS score and trend
    avg_score = sum(log.total_mrs_score for log in logs) / total_logs
    
    if total_logs > 1:
        oldest = logs[0].total_mrs_score
        newest = logs[total_logs - 1].total_mrs_score
        diff = newest - oldest
        if diff > 0:
            trend_msg = f"+{diff} points since start of period (increasing severity)"
        elif diff < 0:
            trend_msg = f"{diff} points since start of period (improving severity)"
        else:
            trend_msg = "stable severity"
    else:
        trend_msg = "No trend comparison available (only 1 log recorded)"
        
    # 3. Identify top 3 symptom categories
    symptom_fields = [
        ('hot_flashes_severity', 'Hot Flashes & Sweating'),
        ('heart_discomfort_severity', 'Heart Discomfort'),
        ('sleep_problems_severity', 'Sleep Problems'),
        ('mood_severity', 'Depressive Mood'),
        ('irritability_severity', 'Irritability'),
        ('anxiety_severity', 'Anxiety'),
        ('physical_exhaustion_severity', 'Physical & Mental Exhaustion'),
        ('sexual_problems_severity', 'Sexual Problems'),
        ('bladder_problems_severity', 'Bladder Problems'),
        ('dryness_severity', 'Vaginal Dryness'),
        ('joint_muscle_pain_severity', 'Joint & Muscular Discomfort'),
    ]
    
    symptom_averages = []
    for field_name, friendly_name in symptom_fields:
        avg_val = sum(getattr(log, field_name) for log in logs) / total_logs
        symptom_averages.append((friendly_name, avg_val))
        
    symptom_averages.sort(key=lambda x: x[1], reverse=True)
    top_3 = symptom_averages[:3]
    top_3_formatted = [{"name": name, "avg_severity": round(val, 2)} for name, val in top_3]
    
    # 4. Rule-based Thyroid check
    avg_mood = sum(l.mood_severity for l in logs) / total_logs
    avg_exhaustion = sum(l.physical_exhaustion_severity for l in logs) / total_logs
    
    has_weight_notes = False
    for log in logs:
        if log.notes:
            notes_lower = log.notes.lower()
            if any(kw in notes_lower for kw in ["weight", "gain", "fatigue", "loss", "thyroid", "slow", "metabolism"]):
                has_weight_notes = True
                break
                
    thyroid_check_triggered = (avg_mood >= 2.0) and (avg_exhaustion >= 2.0) and has_weight_notes
    thyroid_warning = "Some of your symptoms overlap with thyroid-related conditions. Consider mentioning this to your doctor for a simple blood test."
    
    # 5. Call LLM API (Groq) for clinical paragraph
    api_key = getattr(settings, 'GROQ_API_KEY', '')
    if not api_key:
        return Response({
            "status": "error",
            "message": "Groq API key not configured on server."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    top_symptom_desc = ", ".join([f"{name} (avg: {round(val, 1)})" for name, val in top_3])
    
    system_prompt = (
        "You are a professional medical summarizer. Write a clean, clinical, professional 1-paragraph summary suitable for a doctor to review during a visit. "
        "Summarize the user's symptoms, average MRS score, trends, and focus areas. Speak objectively and clinically. Do not diagnose."
    )
    
    user_prompt = (
        f"Generate a professional clinical summary for a doctor visit.\n"
        f"Patient data from the last 30 days:\n"
        f"- Number of logs: {total_logs}\n"
        f"- Average Menopause Rating Scale (MRS) Score: {round(avg_score, 1)} (Max is 44)\n"
        f"- Trend: {trend_msg}\n"
        f"- Top 3 focus areas: {top_symptom_desc}\n\n"
        f"Write exactly 1 paragraph. Keep it objective, professional, and clear for a medical professional."
    )
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        clinical_summary = data['choices'][0]['message']['content'].strip()
        
        # If thyroid warning is triggered, append it to the summary report
        if thyroid_check_triggered:
            clinical_summary += f" {thyroid_warning}"
            
        # Save generated report to history
        report = DoctorSummaryReport.objects.create(
            user=request.user,
            mrs_score=round(avg_score, 1),
            content=clinical_summary
        )
            
        return Response({
            "status": "success",
            "id": report.id,
            "created_at": report.created_at,
            "summary": clinical_summary,
            "avg_score": round(avg_score, 1),
            "trend_message": trend_msg,
            "top_symptoms": top_3_formatted,
            "thyroid_check_triggered": thyroid_check_triggered,
            "thyroid_warning": thyroid_warning if thyroid_check_triggered else ""
        }, status=status.HTTP_200_OK)
    except requests.exceptions.RequestException as e:
        return Response({
            "status": "error",
            "message": f"AI summarization service failed: {str(e)}"
        }, status=status.HTTP_502_BAD_GATEWAY)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_workplace_letter(request):
    """
    Generate a professional workplace accommodation request letter
    tailored to the user's recent symptoms and role.
    """
    job_role = request.data.get('job_role', '').strip()
    specific_concerns = request.data.get('specific_concerns', '').strip()

    # Pull last 30 days of symptom data for context
    start_date = datetime.date.today() - datetime.timedelta(days=30)
    logs = SymptomLog.objects.filter(user=request.user, date__gte=start_date).order_by('date')
    total_logs = len(logs)

    # Build a symptom context summary
    if total_logs > 0:
        avg_score = round(sum(log.total_mrs_score for log in logs) / total_logs, 1)
        latest = logs[total_logs - 1]
        top_symptoms = []
        symptom_fields = [
            ('hot_flashes_severity', 'hot flashes'),
            ('sleep_problems_severity', 'sleep disturbance'),
            ('mood_severity', 'mood changes'),
            ('anxiety_severity', 'anxiety'),
            ('physical_exhaustion_severity', 'physical exhaustion'),
            ('joint_muscle_pain_severity', 'joint and muscle pain'),
            ('irritability_severity', 'irritability'),
        ]
        for field, label in symptom_fields:
            val = getattr(latest, field, 0)
            if val >= 2:
                top_symptoms.append(label)
        symptom_context = f"Average MRS Score: {avg_score}/44. Prominent recent symptoms include: {', '.join(top_symptoms) if top_symptoms else 'general menopause-related discomfort'}."
    else:
        symptom_context = "The patient has begun tracking menopause symptoms and is experiencing various perimenopause and menopause-related challenges."

    api_key = getattr(settings, 'GROQ_API_KEY', '')
    if not api_key:
        return Response({
            "status": "error",
            "message": "Groq API key not configured on server."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    role_context = f"Her job role is: {job_role}." if job_role else "Her job role has not been specified."
    concerns_context = f"She has the following specific concerns or requests: {specific_concerns}." if specific_concerns else ""

    system_prompt = (
        "You are a professional HR communication assistant. Draft respectful, concise, professional workplace "
        "accommodation request emails for employees experiencing menopause. The tone must be warm, dignified, "
        "non-dramatic, and free of medical jargon. Focus on practical workplace accommodations only. "
        "Never include diagnoses or overly personal medical details."
    )

    user_prompt = (
        f"Draft a brief, professional email from an employee to their manager or HR department, "
        f"requesting reasonable workplace accommodations due to perimenopause/menopause symptoms.\n\n"
        f"Context:\n"
        f"- {role_context}\n"
        f"- Symptom context: {symptom_context}\n"
        f"- {concerns_context}\n\n"
        f"The letter should:\n"
        f"1. Open respectfully and professionally.\n"
        f"2. Briefly mention she is experiencing health-related challenges (without clinical detail).\n"
        f"3. Request specific, practical accommodations (e.g. temperature control, flexible break times, "
        f"option for remote days, access to a quiet space, adjusted start times).\n"
        f"4. Express gratitude and willingness to discuss further.\n"
        f"5. Close professionally.\n\n"
        f"Keep it concise - no longer than 3 short paragraphs. Make it editable by the employee."
    )

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        letter_text = data['choices'][0]['message']['content'].strip()

        # Save generated letter to history
        letter = WorkplaceLetter.objects.create(
            user=request.user,
            job_role=job_role,
            concerns=specific_concerns,
            content=letter_text
        )

        return Response({
            "status": "success",
            "id": letter.id,
            "created_at": letter.created_at,
            "letter": letter_text,
            "symptom_context": symptom_context
        }, status=status.HTTP_200_OK)
    except requests.exceptions.RequestException as e:
        return Response({
            "status": "error",
            "message": "AI service request failed."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_doctor_summary_history(request):
    """
    GET: Return all past doctor summaries generated by the user.
    """
    reports = DoctorSummaryReport.objects.filter(user=request.user)
    serializer = DoctorSummaryReportSerializer(reports, many=True)
    return Response({
        "status": "success",
        "history": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_workplace_letter_history(request):
    """
    GET: Return all past workplace letters generated by the user.
    """
    letters = WorkplaceLetter.objects.filter(user=request.user)
    serializer = WorkplaceLetterSerializer(letters, many=True)
    return Response({
        "status": "success",
        "history": serializer.data
    }, status=status.HTTP_200_OK)
