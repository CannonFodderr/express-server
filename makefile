build:
	yarn build;
install:
	yarn install;
start:
	yarn start;
test:
	yarn test;
clean:
	yarn clean;
docker-build:
	docker build -t server-template-app .;
docker-run:
	docker run --env-file ./.env -p 5000:5000 server-template-app;
