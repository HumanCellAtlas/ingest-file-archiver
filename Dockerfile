FROM node:8-alpine

WORKDIR /app
COPY app.ts package*.json tsconfig.json ./
ADD fastq ./fastq
ADD src ./src
ADD config ./config

COPY run.sh ./run.sh
RUN chmod +x run.sh

RUN npm install
RUN npm run build-ts

RUN apk update && apk add bash libbz2 xz-dev libffi-dev openssl-dev python3 build-base python3-dev py3-pip
RUN pip3 install hca

# Required for fastq2bam to find its binaries
ENV PATH="${PATH}:/app/fastq/bin"
RUN chmod +x /app/fastq/bin/fastq2bam
RUN which fastq2bam

ENTRYPOINT ["/app/run.sh"]
