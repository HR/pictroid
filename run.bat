@echo off
FOR /F %%A IN (app.env) DO set %%A
if not exist data mkdir data
start cmd /k mongod --dbpath "data"
IF /I "%1"=="" GOTO DEFAULT 
IF /I "%1"=="-p" GOTO PROD
IF /I "%1"=="-d" GOTO DEV
@echo on
:DEFAULT
GOTO DEV
:PROD
echo "Production mode"
SET NODE_ENV=production
start cmd /k mongo ds037508.mongolab.com:37508/heroku_app23982462 -u %DbUser% -p %DbPass%
nodemon server.js
:DEV
SET NODE_ENV=development
start cmd /k mongo cache
nodemon server.js