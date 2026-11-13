# Production Nginx Container serving prebuilt Vite SPA
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy prebuilt dist static assets
COPY dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Support dynamic Cloud Run $PORT and runtime API URL injection
ENV PORT=80
EXPOSE 80

CMD ["sh", "-c", "sed -i 's/listen 80;/listen '\"${PORT:-80}\"';/g' /etc/nginx/conf.d/default.conf && if [ -n \"$VITE_API_URL\" ]; then sed -i \"s|BACKEND_API_URL_PLACEHOLDER|${VITE_API_URL}|g\" /usr/share/nginx/html/index.html; fi && nginx -g 'daemon off;'"]
