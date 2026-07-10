from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    health_check, register_user, MyTokenObtainPairView,
    log_symptom, update_symptom_log, get_symptom_history,
    get_mrs_score, get_symptom_trends,
    chat_sessions, chat_session_messages, delete_chat_session, ask_ai,
    get_doctor_summary, generate_workplace_letter
)

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('auth/register/', register_user, name='register_user'),
    path('auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Symptoms
    path('symptoms/log/', log_symptom, name='log_symptom'),
    path('symptoms/log/update/', update_symptom_log, name='update_symptom_log'),
    path('symptoms/history/', get_symptom_history, name='symptom_history'),
    path('symptoms/mrs-score/', get_mrs_score, name='mrs_score'),
    path('symptoms/trends/', get_symptom_trends, name='symptom_trends'),
    # Chat
    path('chat/sessions/', chat_sessions, name='chat_sessions'),
    path('chat/sessions/<int:session_id>/messages/', chat_session_messages, name='chat_session_messages'),
    path('chat/sessions/<int:session_id>/delete/', delete_chat_session, name='delete_chat_session'),
    path('chat/ask/', ask_ai, name='ask_ai'),
    # Reports
    path('summary/doctor-report/', get_doctor_summary, name='doctor_report'),
    path('workplace/generate-letter/', generate_workplace_letter, name='generate_workplace_letter'),
]
