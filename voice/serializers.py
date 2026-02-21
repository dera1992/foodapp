from rest_framework import serializers


class VoiceInterpretSerializer(serializers.Serializer):
    text = serializers.CharField()
    mode = serializers.CharField(required=False, allow_blank=True)
    prefer_rules = serializers.BooleanField(required=False, default=False)
