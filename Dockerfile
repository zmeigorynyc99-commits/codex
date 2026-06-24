FROM python:3.12-slim
WORKDIR /course
COPY . /course
EXPOSE 8080
CMD ["python", "site/server.py"]
