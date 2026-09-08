FROM mongo:8.0

WORKDIR /backup

COPY run-once.sh entrypoint.sh restore.sh ./
RUN chmod +x /backup/run-once.sh /backup/entrypoint.sh /backup/restore.sh

ENTRYPOINT ["/backup/entrypoint.sh"]
