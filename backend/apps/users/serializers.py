from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "date_joined"]


class UpdateProfileSerializer(serializers.Serializer):
    current_username = serializers.CharField(required=True)
    new_username = serializers.CharField(required=False, max_length=150)
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=False, write_only=True, min_length=8)

    def validate_current_username(self, value):
        user = self.context.get("user")
        if user.username != value:
            raise serializers.ValidationError("Current username is incorrect.")
        return value

    def validate_new_username(self, value):
        user = self.context.get("user")
        if User.objects.filter(username=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, data):
        user = self.context.get("user")
        if not user.check_password(data["current_password"]):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})
        if "new_username" not in data and "new_password" not in data:
            raise serializers.ValidationError("Please provide at least a new username or new password.")
        return data
