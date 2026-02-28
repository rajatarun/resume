#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const TOPIC_CATEGORY_MAP = {
  genai: "GenAI",
  backend: "Backend",
  frontend: "Frontend",
  cloud: "Cloud"
};

const LANGUAGE_CATEGORY_MAP = {
  typescript: "Frontend",
  javascript: "Frontend",
  java: "Backend",
  go: "Backend",
  python: "GenAI",
  hcl: "Cloud",
  terraform: "Cloud"
};

function getEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function humanizeRepoName(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function deriveCategories(topics, language) {
  const categories = new Set();

  for (const topic of topics) {
    const mappedCategory = TOPIC_CATEGORY_MAP[topic.toLowerCase()];
    if (mappedCategory) {
      categories.add(mappedCategory);
    }
  }

  if (categories.size === 0 && language) {
    const mappedCategory = LANGUAGE_CATEGORY_MAP[language.toLowerCase()];
    if (mappedCategory) {
      categories.add(mappedCategory);
    }
  }

  if (categories.size === 0) {
    categories.add("All");
  }

  return Array.from(categories);
}

function buildQuery(ownerType) {
  if (ownerType === "user") {
    return `
      query FetchRepositories($owner: String!, $cursor: String) {
        user(login: $owner) {
          repositories(
            first: 100
            after: $cursor
            ownerAffiliations: OWNER
            orderBy: { field: UPDATED_AT, direction: DESC }
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              name
              description
              url
              homepageUrl
              stargazerCount
              forkCount
              isFork
              isArchived
              updatedAt
              primaryLanguage {
                name
              }
              repositoryTopics(first: 20) {
                nodes {
                  topic {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;
  }

  if (ownerType === "org") {
    return `
      query FetchRepositories($owner: String!, $cursor: String) {
        organization(login: $owner) {
          repositories(
            first: 100
            after: $cursor
            orderBy: { field: UPDATED_AT, direction: DESC }
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              name
              description
              url
              homepageUrl
              stargazerCount
              forkCount
              isFork
              isArchived
              updatedAt
              primaryLanguage {
                name
              }
              repositoryTopics(first: 20) {
                nodes {
                  topic {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;
  }

  throw new Error('GITHUB_OWNER_TYPE must be either "user" or "org".');
}

async function fetchRepositories({ token, owner, ownerType }) {
  const query = buildQuery(ownerType);
  const nodes = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query,
        variables: { owner, cursor }
      })
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      const diagnostics = responseBody?.message || JSON.stringify(responseBody);
      throw new Error(`GitHub GraphQL request failed (${response.status} ${response.statusText}): ${diagnostics}`);
    }

    if (Array.isArray(responseBody.errors) && responseBody.errors.length > 0) {
      const message = responseBody.errors.map((error) => error.message).join("; ");
      throw new Error(`GitHub GraphQL returned errors: ${message}`);
    }

    const ownerNode = ownerType === "user" ? responseBody?.data?.user : responseBody?.data?.organization;
    if (!ownerNode) {
      throw new Error(`GitHub ${ownerType} \"${owner}\" not found or token lacks access.`);
    }

    const repositoryConnection = ownerNode.repositories;
    nodes.push(...repositoryConnection.nodes);
    hasNextPage = repositoryConnection.pageInfo.hasNextPage;
    cursor = repositoryConnection.pageInfo.endCursor;
  }

  return nodes;
}

async function main() {
  const token = getEnv("GITHUB_TOKEN");
  const owner = getEnv("GITHUB_OWNER");
  const ownerType = getEnv("GITHUB_OWNER_TYPE").toLowerCase();

  const repositories = await fetchRepositories({ token, owner, ownerType });

  const includedProjects = repositories
    .filter((repo) => !repo.isFork && !repo.isArchived)
    .map((repo) => {
      const topics = repo.repositoryTopics.nodes.map((node) => node.topic.name.toLowerCase());
      const language = repo.primaryLanguage?.name || "";
      const categories = deriveCategories(topics, language);

      return {
        id: repo.name,
        title: humanizeRepoName(repo.name),
        description: repo.description || "",
        url: repo.url,
        homepage: repo.homepageUrl || "",
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        language,
        updatedAt: repo.updatedAt,
        topics,
        categories
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const output = {
    generatedAt: new Date().toISOString(),
    projects: includedProjects
  };

  const outputDir = path.join(process.cwd(), "public");
  const outputPath = path.join(outputDir, "projects.json");
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Fetched ${repositories.length} repositories from GitHub.`);
  console.log(`Included ${includedProjects.length} repositories after filtering forks/archived.`);
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error("Failed to sync GitHub projects.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
