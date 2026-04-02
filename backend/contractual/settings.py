"""
Django settings for contractual project.
https://docs.djangoproject.com/en/6.0/ref/settings/
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv('DATA_DIR', BASE_DIR))

# --- Security -----------------------------------------------------------

DEBUG = os.getenv('DEBUG', 'true').lower() in ('1', 'true', 'yes')

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    _key_file = DATA_DIR / '.secret_key'
    if _key_file.exists():
        SECRET_KEY = _key_file.read_text().strip()
    else:
        import secrets
        SECRET_KEY = secrets.token_hex(50)
        _key_file.parent.mkdir(parents=True, exist_ok=True)
        _key_file.write_text(SECRET_KEY)

ALLOWED_HOSTS = [
    h.strip() for h in os.getenv('ALLOWED_HOSTS', '*').split(',') if h.strip()
]

APPEND_SLASH = True

# --- Apps / Middleware ---------------------------------------------------

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'core',
    'materials',
    'clients',
    'jobs',
    'settings_app',
    'drf_spectacular',
    'dj_rest_auth',
    'django_cleanup.apps.CleanupConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'djangorestframework_camel_case.middleware.CamelCaseMiddleWare',
]

ROOT_URLCONF = 'contractual.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'contractual.wsgi.application'

# --- Database ------------------------------------------------------------
# Set DATABASE_URL to a PostgreSQL URL to use Postgres; otherwise SQLite.

_db_url = os.getenv('DATABASE_URL', '')

if _db_url.startswith(('postgres://', 'postgresql://')):
    from urllib.parse import urlparse, unquote
    _parsed = urlparse(_db_url)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': _parsed.path.lstrip('/'),
            'USER': unquote(_parsed.username or ''),
            'PASSWORD': unquote(_parsed.password or ''),
            'HOST': _parsed.hostname or 'localhost',
            'PORT': _parsed.port or 5432,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': DATA_DIR / 'db.sqlite3',
        }
    }

# --- Auth ----------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- i18n ----------------------------------------------------------------

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- Static / Media files ------------------------------------------------

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = DATA_DIR / 'media'

# --- Django REST Framework -----------------------------------------------

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'djangorestframework_camel_case.render.CamelCaseJSONRenderer',
        'djangorestframework_camel_case.render.CamelCaseBrowsableAPIRenderer',
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'djangorestframework_camel_case.parser.CamelCaseFormParser',
        'djangorestframework_camel_case.parser.CamelCaseMultiPartParser',
        'djangorestframework_camel_case.parser.CamelCaseJSONParser',
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'COERCE_DECIMAL_TO_STRING': False,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Contractual API',
    'POSTPROCESSING_HOOKS': [
        'drf_spectacular.hooks.postprocess_schema_enums',
        'drf_spectacular.contrib.djangorestframework_camel_case.camelize_serializer_fields',
    ],
    'CAMELIZE_NAMES': True,
}

JSON_CAMEL_CASE = {
    'JSON_UNDERSCOREIZE': {
        'no_underscore_before_number': True,
    },
}

CORS_ALLOW_ALL_ORIGINS = DEBUG

CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://localhost:8000').split(',') if o.strip()
]

# --- dj-rest-auth ---------------------------------------------------------

REST_AUTH = {
    'USE_JWT': False,
    'SESSION_LOGIN': True,
    'PASSWORD_RESET_USE_SITES_FRAMEWORK': False,
    'OLD_PASSWORD_FIELD_ENABLED': True,
    'TOKEN_MODEL': None,
    'TOKEN_CREATOR': None,
}

# Use session cookie for CSRF; share login between API and Django admin
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
