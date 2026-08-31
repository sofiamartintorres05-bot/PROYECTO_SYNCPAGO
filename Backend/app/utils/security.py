import hashlib
import os

# =========================================================
# CIFRAR CONTRASEÑA (HASHING)
# =========================================================
def cifrar_contrasena(password: str) -> str:
    # Generamos un "salt" (semilla aleatoria de 16 bytes) para que contraseñas iguales tengan hashes diferentes
    salt = os.urandom(16)
    # Aplicamos PBKDF2 con 100,000 iteraciones usando SHA-256
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    # Retornamos el salt y la clave cifrada en formato de texto hexagonal separados por ":"
    return f"{salt.hex()}:{key.hex()}"

# =========================================================
# VERIFICAR CONTRASEÑA
# =========================================================
def verificar_contrasena(stored_password: str, provided_password: str) -> bool:
    try:
        # Recuperamos el salt y la clave original que guardamos en la BD
        salt_hex, key_hex = stored_password.split(':')
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        # Volvemos a cifrar la contraseña ingresada en el login con el mismo salt e iteraciones
        new_key = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt, 100000)
        # Comparamos si los resultados son idénticos
        return new_key == key
    except Exception:
        return False