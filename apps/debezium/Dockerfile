

FROM redpandadata/connectors:v1.0.13

USER root
COPY ./elastic/ca.crt /etc/ssl/certs/
COPY ./elastic/tls.crt /etc/ssl/certs/
RUN keytool -import -trustcacerts -alias elasticsearch-ca -file /etc/ssl/certs/ca.crt -keystore /etc/ssl/certs/elasticsearch-truststore.jks -storepass changeme -noprompt
RUN keytool -import -trustcacerts -alias elasticsearch-tls -file /etc/ssl/certs/tls.crt -keystore /etc/ssl/certs/elasticsearch-keystore.jks -storepass changeme -noprompt
RUN chown 1001:1001 /etc/ssl/certs/elasticsearch-truststore.jks && \
    chown 1001:1001 /etc/ssl/certs/elasticsearch-keystore.jks

COPY ./kafka/ca.crt /etc/ssl/certs/kafka-ca.crt
COPY ./kafka/tls.crt /etc/ssl/certs/kafka-tls.crt
RUN keytool -import -trustcacerts -alias kafka-ca -file /etc/ssl/certs/kafka-ca.crt -keystore /etc/ssl/certs/kafka-truststore.jks -storepass changeme -noprompt
RUN keytool -import -trustcacerts -alias kafka-tls -file /etc/ssl/certs/kafka-tls.crt -keystore /etc/ssl/certs/kafka-keystore.jks -storepass changeme -noprompt
RUN chown 1001:1001 /etc/ssl/certs/kafka-truststore.jks && \
    chown 1001:1001 /etc/ssl/certs/kafka-keystore.jks
USER 1001

COPY ./debezium-connector-postgres /opt/kafka/redpanda-plugins/debezium-connector-postgres/
COPY ./confluentinc-kafka-connect-elasticsearch-14.0.12 /opt/kafka/redpanda-plugins/confluentinc-kafka-connect-elasticsearch-14.0.12/
COPY ./confluentinc-kafka-connect-avro-converter-7.5.3 /opt/kafka/redpanda-plugins/confluentinc-kafka-connect-avro-converter-7.5.3/

COPY ./common-config /opt/kafka/redpanda-plugins/common-config
COPY ./common-utils /opt/kafka/redpanda-plugins/common-utils
COPY ./kafka-avro-serializer /opt/kafka/redpanda-plugins/kafka-avro-serializer
COPY ./kafka-connect-avro-data /opt/kafka/redpanda-plugins/kafka-connect-avro-data
COPY ./kafka-schema-registry-client /opt/kafka/redpanda-plugins/kafka-schema-registry-client
COPY ./kafka-schema-serializer /opt/kafka/redpanda-plugins/kafka-schema-serializer

