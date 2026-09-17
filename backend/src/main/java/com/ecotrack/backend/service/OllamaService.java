package com.ecotrack.backend.service;

import com.ecotrack.backend.entity.CarbonActivity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
public class OllamaService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private final String ollamaApiUrl;
    private final String ollamaApiKey;
    private final String ollamaModel;

    public OllamaService() {

        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();

        /*
         * Railway:
         * OLLAMA_API_URL=https://ollama.com/api/chat
         * OLLAMA_API_KEY=your-secret-key
         * OLLAMA_MODEL=gpt-oss:20b-cloud
         *
         * Local development:
         * If these variables are not present,
         * Ollama will use the local Ollama server.
         */

        this.ollamaApiUrl = System.getenv()
                .getOrDefault(
                        "OLLAMA_API_URL",
                        "http://localhost:11434/api/chat"
                );

        this.ollamaApiKey = System.getenv("OLLAMA_API_KEY");

        this.ollamaModel = System.getenv()
                .getOrDefault(
                        "OLLAMA_MODEL",
                        "llama3.2"
                );
    }

    private String callOllama(String prompt) {

        try {

            Map<String, Object> requestBody = Map.of(
                    "model", ollamaModel,
                    "messages", List.of(
                            Map.of(
                                    "role", "user",
                                    "content", prompt
                            )
                    ),
                    "stream", false
            );

            String jsonBody =
                    objectMapper.writeValueAsString(requestBody);

            HttpRequest.Builder requestBuilder =
                    HttpRequest.newBuilder()
                            .uri(URI.create(ollamaApiUrl))
                            .header(
                                    "Content-Type",
                                    "application/json"
                            )
                            .POST(
                                    HttpRequest.BodyPublishers
                                            .ofString(jsonBody)
                            );

            /*
             * Add Authorization only when an API key exists.
             * Railway uses the Ollama Cloud API key.
             * Local Ollama does not need this.
             */

            if (ollamaApiKey != null &&
                    !ollamaApiKey.trim().isEmpty()) {

                requestBuilder.header(
                        "Authorization",
                        "Bearer " + ollamaApiKey
                );
            }

            HttpResponse<String> response =
                    httpClient.send(
                            requestBuilder.build(),
                            HttpResponse.BodyHandlers.ofString()
                    );

            if (response.statusCode() != 200) {

                throw new RuntimeException(
                        "Ollama returned status: "
                                + response.statusCode()
                                + " - "
                                + response.body()
                );
            }

            JsonNode jsonResponse =
                    objectMapper.readTree(response.body());

            JsonNode content =
                    jsonResponse
                            .path("message")
                            .path("content");

            if (content.isMissingNode()) {

                throw new RuntimeException(
                        "Invalid Ollama response: "
                                + response.body()
                );
            }

            return content.asText();

        } catch (Exception e) {

            e.printStackTrace();

            return "Sorry, I couldn't connect to EcoBot right now. "
                    + "Please try again.";
        }
    }


    public String chat(String userMessage) {

        String prompt = """
                You are EcoBot, the AI sustainability assistant for EcoTrack.

                Your job is to help users understand and reduce their carbon footprint.

                Answer the user's question clearly, simply, and practically.

                Give useful sustainability advice related to:
                carbon footprint, transportation, electricity, food, waste,
                water, recycling, and sustainable lifestyle.

                Do not make up the user's personal carbon data.

                If the user asks about their personal EcoTrack data,
                explain that personalized data is available when EcoTrack
                provides it to you.

                Keep the answer friendly and easy to understand.
                Avoid unnecessary long explanations.

                User message:
                %s
                """.formatted(userMessage);

        return callOllama(prompt);
    }


    public String generateRecommendation(
            String category,
            double emission
    ) {

        String prompt = """
                You are EcoBot, the AI sustainability assistant for EcoTrack.

                Analyze the user's carbon footprint information.

                Category: %s
                Carbon emission: %.2f kg CO2e

                Give one personalized and practical sustainability recommendation.
                Keep it simple and actionable.
                Do not use bullet points.
                Maximum 2 sentences.
                """.formatted(category, emission);

        return callOllama(prompt);
    }


    public String personalizedChat(
            String userMessage,
            String email,
            List<CarbonActivity> activities
    ) {

        StringBuilder data = new StringBuilder();

        double totalEmission = 0.0;

        for (CarbonActivity activity : activities) {

            if (activity.getCategory() == null ||
                    activity.getCarbonEmission() == null) {
                continue;
            }

            totalEmission += activity.getCarbonEmission();

            data.append("- Category: ")
                    .append(activity.getCategory())
                    .append(", Emission: ")
                    .append(
                            String.format(
                                    "%.2f",
                                    activity.getCarbonEmission()
                            )
                    )
                    .append(" kg CO2");

            if (activity.getDescription() != null) {

                data.append(", Description: ")
                        .append(activity.getDescription());
            }

            data.append("\n");
        }

        String prompt = """
                You are EcoBot, the AI sustainability assistant for EcoTrack.

                You have access to the user's actual EcoTrack carbon activity data.

                User email:
                %s

                Total recorded carbon emission:
                %.2f kg CO2

                User's carbon activities:
                %s

                User's question:
                %s

                Instructions:
                - Use ONLY the carbon data provided above when discussing the user's personal footprint.
                - Do not invent any personal data.
                - Identify important patterns from the user's activities.
                - If one category has a high emission, mention it.
                - Give practical and simple sustainability advice.
                - If the question is not related to personal carbon data, answer normally as EcoBot.
                - Keep the response friendly and easy to understand.
                - Do not mention technical details such as databases, APIs, Java, or Ollama.

                Answer the user's question:
                """.formatted(
                email,
                totalEmission,
                data,
                userMessage
        );

        return callOllama(prompt);
    }
}