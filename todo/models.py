from django.db import models
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=30, blank=True)
    avatar_url = models.CharField(max_length=500, blank=True, default="https://via.placeholder.com/150")
    
    def __str__(self):
        return f'{self.user.username} Profile'

# Signal to auto-create a Profile when a User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        # If the profile doesn't exist (e.g. old user), create it now
        Profile.objects.create(user=instance)

class Task(models.Model):
    class Priority(models.TextChoices):
        LOW = 'Low', 'Low'
        MEDIUM = 'Medium', 'Medium'
        HIGH = 'High', 'High'

    # New Status Choices
    class Status(models.TextChoices):
        QUEUE = 'Queue', 'Queue'
        IN_PROGRESS = 'In Progress', 'In Progress'
        COMPLETED = 'Completed', 'Completed'
        ABORTED = 'Aborted', 'Aborted'
        
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.LOW)
    
    # New status field
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUE)
    
    due_date = models.DateField()
    
    # We keep is_completed for now to avoid breaking old migrations immediately, 
    # but logic will move to 'status'
    is_completed = models.BooleanField(default=False) 
    
    # NEW FIELD: For Drag and Drop ordering
    order = models.FloatField(default=0.0)
    
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    
    class Meta:
        ordering = ['order', '-created_at'] # Sort by order first, then by created_at descending
    
    def save(self, *args, **kwargs):
        # Sync legacy is_completed field with new status
        if self.status == self.Status.COMPLETED:
            self.is_completed = True
            if not self.completed_at:
                self.completed_at = timezone.now()
        else:
            self.is_completed = False
            self.completed_at = None
            
        super().save(*args, **kwargs)
        
    def __str__(self):
        return self.title