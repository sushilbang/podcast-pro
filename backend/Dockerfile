# backend/Dockerfile

FROM python:3.11-slim
WORKDIR /code

# Copy the requirements file from the 'backend' subfolder first
COPY backend/requirements.txt /code/requirements.txt

# Install ffmpeg (for ffprobe)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install the dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# This copies everything inside 'backend' into the '/code' directory in the container
COPY backend/ . /code/

# Expose the port
EXPOSE 8080

# The CMD line is now correct because all the backend code is inside /code
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]