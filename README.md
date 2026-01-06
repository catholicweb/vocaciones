# Template for parish websites

Visit parroquia.app for a working example.

The aim is to provide a simple template for non-technical users to be able to create a modern parish website. For that we provide the user with a simple input template (stage 1), we process that simplified input (stage 2) into something a modern tool like Vitepress can render (stage 3)

## Setup

```bash
npm install
npm run docs:before-build
npm run docs:build # or npm run docs:dev
```

## Stage 1. User input: Pages CMS

Enable user to input data, everything here is beautifully managed by pagescms.org.

Key files are:

- .pages.yml - Pages CMS config file (all the magic is here)
- pages/config.json - Global site configuration (fonts, nav bar, languages...)
- pages/events.json - Where events live
- pages/\*.md - Any .md file here will be processed, translated and published to the end user
- docs/media/ - Media files live here

## Stage 2. The adapter: 'npm run docs:before-build'

This is the key stage, it takes user input and process it, creating the necesary files for stage 3 (vitepress) to do its magic. It takes the pages at pages/\*.md proccess them (translate/modify/fetch resource/...) and saves them per language at docs/\*.md

```bash
npm run docs:before-build
```

Key bits are:

- Translate - Autotranslates key fields
- Optimizes images - Creates images with different sizes, genenates PWA icons...
- Fetch Youtube videos
- Fetch Google calendar events, merging them with the ones at pages/events.json
- Fetch gospel
- Fetch internal/external pages preview (oembed), eg: fetches youtube video thunbmail from its url
- Fetch changes on upstream template to keep up to date with changes
- ...

## Stage 3. Publising: Vitepress + Tailwind CSS v4

Takes the input at docs/\*.md and creates a magnificent website.

```bash
npm run docs:build
	# or
npm run docs:dev
```

Key elements are:

- docs/.vitepress/theme/Layout.vue - We follow a modular approach, this components takes each section defined in the .md and renders it
- docs/.vitepress/theme/components/\* - Each section is rendered using a custom .vue component
