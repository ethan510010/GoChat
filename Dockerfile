FROM node:10.15.1

WORKDIR /workspace
# 複製當前目錄 (.) 到 container 的 /workspace 資料夾
COPY ./package.json /workspace
RUN npm install
RUN npm i pm2 -g
COPY . /workspace
# 容器切換到 /workspace 資料夾

# 將 container 的 3000 port 對外開放
EXPOSE 3000
# 執行腳本命令
CMD ["pm2-runtime", "process.yaml"]