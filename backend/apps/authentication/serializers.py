import logging

from django.contrib.auth import authenticate
from rest_framework import serializers

logger = logging.getLogger(__name__)


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=4, max_length=150, required=True)
    password = serializers.CharField(min_length=8, required=True, write_only=True)
    password2 = serializers.CharField(min_length=8, required=True, write_only=True)

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return data


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        user = authenticate(username=data["username"], password=data["password"])
        if not user:
            raise serializers.ValidationError({"non_field_errors": "Invalid username or password."})
        if not user.is_active:
            raise serializers.ValidationError({"non_field_errors": "This account has been disabled."})
        data["user"] = user
        return data
