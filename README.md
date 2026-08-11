# PracticeApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.12.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Typing Velocity Tracking

This repository is a working reference implementation of a keystroke velocity feature
intended for transfer into a production application.

- **The feature** lives in `src/app/features/keystroke-tracking/`. Copy that folder as a
  unit; it depends only on `@angular/core` and `@angular/common`.
- **Sandbox scaffolding** lives in `src/app/sandbox/` and the demo loan app around it.
  None of it transfers. Search for `SANDBOX ONLY` to find every scaffolding touch point.

Architecture, the reporting boundary, the transfer checklist, and known issues are
documented in [`docs/typing-velocity.md`](docs/typing-velocity.md). Recorded metric
samples from human and scripted sessions are in [`docs/test-results.md`](docs/test-results.md).
