# Usamos la imagen oficial de MySQL 8
FROM mysql:8.0

# Variables de entorno obligatorias
ENV MYSQL_ROOT_PASSWORD=admin124
ENV MYSQL_DATABASE=usuarios
ENV MYSQL_USER=useradmin
ENV MYSQL_PASSWORD=adminpass

# Copiamos los scripts SQL al contenedor para inicialización
# Cualquier archivo .sql en /docker-entrypoint-initdb.d se ejecuta al primer arranque
COPY ./mysql-init/ /docker-entrypoint-initdb.d/
