const token = "TUTAJ_BARDZO_TAJNY_TOKEN";
const channelId = "1519747244956324111";
const websiteUrl = "https://777-discordbot-tomson-s-projects.vercel.app/apply";

const message = {
  embeds: [
    {
      title: "🔥 Rekrutacja otwarta!",
      description: "Szukamy nowych osób do naszego grona.\nJeśli chcesz do nas dołączyć, kliknij przycisk poniżej, aby złożyć wniosek przez nasz portal!\n\nProces zajmie Ci tylko chwilę.",
      color: 0x00FF00
    }
  ],
  components: [
    {
      type: 1, // ActionRow
      components: [
        {
          type: 2, // Button
          style: 5, // URL Button
          label: "Złóż Podanie",
          url: websiteUrl
        }
      ]
    }
  ]
};

fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
  method: "POST",
  headers: {
    "Authorization": `Bot ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(message)
})
.then(res => res.json())
.then(data => console.log("Wysłano pomyślnie!", data))
.catch(err => console.error("Błąd:", err));
