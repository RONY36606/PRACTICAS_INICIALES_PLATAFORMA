//api
```
go run main.go
```
```bash
docker build -t api .

docker run -d -p 8001:8001 --name api_d api
```
//programaSimple
```
go run main.go
```
```bash
docker build -t programa_simple . //crear imagen

docker run -it --name p_s programa_simple //crear y ejecutar contenedor
```
//backend
```
npm start
```
```bash
docker build -t backend .

docker run -d -p 3000:3000 --name bknd backend
```
//frontend
```
ng serve
```
```bash
docker build -t frontend .

docker run -d -p 4200:80 --name ftnd frontend
```
//DB/docker
```bash
docker build -t mysql_custom:1.0 .

docker run -d \
  --name mysql_BBDD_I3G2 \
  -p 3306:3306 \
  mysql_custom:1.0
```
```bash
docker exec -it mysql_BBDD_I3G2 mysql -u root -p
```
