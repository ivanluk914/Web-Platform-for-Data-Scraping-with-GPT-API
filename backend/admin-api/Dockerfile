FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY backend/admin-api/go.mod backend/admin-api/go.sum ./

RUN go mod download

COPY backend/admin-api/ .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM alpine:latest  

WORKDIR /root/

COPY --from=builder /app/main .

COPY backend/admin-api/config.yaml .

EXPOSE 8080

CMD ["./main"]