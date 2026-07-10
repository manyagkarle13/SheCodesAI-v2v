from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    email = models.EmailField(unique=True)
    age = models.IntegerField(null=True, blank=True)
    
    # Use email for authentication instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        # Auto-populate username with email if not explicitly set
        if not self.username and self.email:
            self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

class SymptomLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="symptom_logs")
    date = models.DateField(auto_now_add=True)
    
    SEVERITY_CHOICES = [
        (0, 'None'),
        (1, 'Mild'),
        (2, 'Moderate'),
        (3, 'Severe'),
        (4, 'Very Severe')
    ]
    
    hot_flashes_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    heart_discomfort_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    sleep_problems_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    mood_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    irritability_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    anxiety_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    physical_exhaustion_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    sexual_problems_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    bladder_problems_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    dryness_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    joint_muscle_pain_severity = models.IntegerField(choices=SEVERITY_CHOICES, default=0)
    
    notes = models.TextField(blank=True, null=True)

    @property
    def total_mrs_score(self):
        return (
            self.hot_flashes_severity +
            self.heart_discomfort_severity +
            self.sleep_problems_severity +
            self.mood_severity +
            self.irritability_severity +
            self.anxiety_severity +
            self.physical_exhaustion_severity +
            self.sexual_problems_severity +
            self.bladder_problems_severity +
            self.dryness_severity +
            self.joint_muscle_pain_severity
        )

    @property
    def mrs_classification(self):
        score = self.total_mrs_score
        if score <= 4:
            return "None to little"
        elif score <= 8:
            return "Mild"
        elif score <= 15:
            return "Moderate"
        else:
            return "Severe"

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Log for {self.user.email} on {self.date}"

class ChatSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=80, default='New Chat')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Session '{self.title}' — {self.user.email}"

class ChatMessage(models.Model):
    ROLE_CHOICES = [('user', 'User'), ('assistant', 'Assistant')]
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"[{self.role}] {self.content[:40]}"


class DoctorSummaryReport(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="doctor_summaries")
    created_at = models.DateTimeField(auto_now_add=True)
    mrs_score = models.FloatField()
    content = models.TextField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Summary Report for {self.user.email} on {self.created_at.strftime('%Y-%m-%d')}"


class WorkplaceLetter(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workplace_letters")
    created_at = models.DateTimeField(auto_now_add=True)
    job_role = models.CharField(max_length=100, blank=True)
    concerns = models.TextField(blank=True)
    content = models.TextField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        role_str = f" ({self.job_role})" if self.job_role else ""
        return f"Workplace Letter{role_str} for {self.user.email} on {self.created_at.strftime('%Y-%m-%d')}"
