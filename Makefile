dev:
	npm run serve:storybook

build:
	rm -rf docs
	npm run build:storybook
	mv storybook-static docs
