import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { ColorSchemeToggle } from "~/components/ColorSchemeToggle/ColorSchemeToggle";
import { listScenarioIDs } from "~/db/database.server";
import { Link, useLoaderData } from "@remix-run/react";
import { Container } from "@mantine/core";

export const meta: MetaFunction = () => {
  return [
    { title: "Mantine Remix App" },
    { name: "description", content: "Welcome to Mantine!" },
  ];
};

export async function loader() {
  return json({scenarios: listScenarioIDs()});
}

export default function Index() {
  const loaded = useLoaderData<typeof loader>();

  return <Container>
    <h1>RecovAir</h1>
    <ColorSchemeToggle />
    <ul>
      {loaded.scenarios.map(s => <li key={s}>
        <Link to={`/scenario/${s}/run`}>{s}</Link>
      </li>)}
    </ul>
    </Container>;
}
