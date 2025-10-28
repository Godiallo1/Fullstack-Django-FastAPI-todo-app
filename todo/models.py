from django.db import models
from django.utils import timezone
from django.conf import settings

# Create your models here.
class Task(models.Model):
    #Define priority field choices
    class Proirity(models.TextChoices):
        LOW = 'Low', 'Low'
        MEDIUM = 'Medium', 'Medium'
        HIGH = 'High', 'High'
        
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Proirity.choices, default=Proirity.LOW)
    due_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    
    def save(self, *args, **Kwargs):
        """Custom save method to set completed_at timestamp when a task is marked as completed."""
        #If the task is being marked as completed and was not completed before
        if self.is_completed and not self.__class__.objects.get(pk = self.pk).is_completed:
            self.completed_at = timezone.now()
            #If s task is being marked as not completed, clear the completed_at timestamp
        elif not self.is_completed:
            self.completed_at = None
        super().save(*args, **Kwargs)
        
        def __str__(self):
            """String representation of the Task model."""
            return self.title