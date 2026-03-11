import factory
from django.contrib.auth.models import User

from apps.categories.models import Category
from apps.notes.models import Note


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user_{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        raw = extracted or "testpass123"
        self.set_password(raw)
        if create:
            self.save()


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    user = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Category {n}")
    description = "A test category"
    color = "#6366f1"


class NoteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Note

    user = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Note {n}")
    content = "Test content"
    category = None
    is_pinned = False
    is_archived = False
