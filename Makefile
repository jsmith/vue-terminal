install:
	npm i
	npm i --no-save vue@2.6.11

dev:
	npm run serve:storybook

# Use this to publish to GitHub pages
build:
	rm -rf docs
	npm run build:storybook
	mv storybook-static docs
