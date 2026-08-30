#use the offical node.js image as our base
FROM node:25

#set the working directory inside the container
WORKDIR /usr/src/app

#copy package.json the package-lock.json first to leverage Docker cache
COPY package*.json ./

#install app dependencies
RUN npm install

#copy the rest of our app's source code into the container
COPY . .

#expose the port the app will run on
EXPOSE 5501

#the command to run our app
CMD ["npm","run","dev"]