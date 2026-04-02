from django.db import models


class Store(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    store_url = models.URLField(blank=True, default="")

    class Meta:
        db_table = 'api_store'

    def __str__(self) -> str:
        return self.name


class Unit(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'api_unit'

    def __str__(self) -> str:
        return self.name


class Tag(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'api_tag'


class TagNotes(models.Model):
    tag = models.OneToOneField(Tag, on_delete=models.CASCADE, related_name="tag_notes")
    notes = models.TextField()

    class Meta:
        db_table = 'api_tagnotes'


class Configuration(models.Model):
    key = models.CharField(max_length=255, primary_key=True)
    value = models.TextField()

    class Meta:
        db_table = 'api_configuration'
