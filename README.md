# AI Chat & PDF Viewer Frontend

## Overview

This project is a modern Next.js frontend application featuring an integrated AI chat interface and PDF document viewer. Built with React, Tailwind CSS, Shadcn UI, and Framer Motion, it serves as the user-facing client for the AI Microservice backend, enabling Retrieval-Augmented Generation (RAG) and local LLM interactions.

## Installation

1. Clone the repository and navigate to the frontend directory:

   ```bash
   cd my_front
   ```
2. Install the required dependencies using npm:

   ```bash
   npm install
   ```
3. Set up your environment variables. Create a `.env` file in the root of `my_front` (if needed) to configure frontend-specific variables.

## Usage

1. Start the development server:

   ```bash
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:3000`.
3. You can now interact with the chat interface and upload or view PDF documents. The application requires the backend microservice to be running to handle RAG and AI requests.

## Licensing

This project is licensed under the MIT License.

## Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bugfix (`git checkout -b feature/my-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/my-feature`).
5. Open a Pull Request for review.

Tasks to do:

- When a file is linked, the chat should be able to answer question that are not related to it. if only says I don't know or similar if the file does not contain the answer and is mentioned by the user or the user clearly wants data from it.
- Make sure you can ask a question and send it with files still processing.



1. Add update query to User message bubble deleting all the next messages to the old updated query.
2. MCP server (google calendar, docs, sheets, etc).
3. Remove all models that are not available with the current api key (depricated, priced, etc).
4. Add Search button.
5. Add Think button.
6. Add Files with RAG capability using BM5 keyword search.
7. Add api key selection for users.