FROM node:8-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

RUN apk update && apk add bash libbz2 xz-dev

# Required for fastq2bam to find its binaries
ENV PATH="${PATH}:/usr/src/app/fastq/bin"

CMD [ "npm", "start" ]
