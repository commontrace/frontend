FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy static site files (context is repo root when dockerfilePath=frontend/Dockerfile)
COPY . /usr/share/nginx/html

# Remove non-servable files
RUN rm -rf /usr/share/nginx/html/frontend /usr/share/nginx/html/railway.toml /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/.git

EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
