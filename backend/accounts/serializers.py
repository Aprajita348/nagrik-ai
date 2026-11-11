from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "phone"]

    def create(self, validated_data):
        return User.objects.create_user(role=User.Role.CITIZEN, **validated_data)


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True, default=None)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "phone", "role", "department", "department_name"]
        