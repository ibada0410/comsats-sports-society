/* Everything the admin can edit. Each section maps to part of content.json.
   Field types: text, textarea, url, image, color, toggle, date, time, number, select, list (of objects), strings (list of text). */

const SPORT_ICON_OPTIONS = [
  ["cricket", "Cricket"], ["football", "Football"], ["hockey", "Hockey"], ["futsal", "Futsal / goal"],
  ["volleyball", "Volleyball"], ["basketball", "Basketball"], ["tugofwar", "Tug of war"], ["badminton", "Badminton"],
  ["tabletennis", "Table tennis"], ["tennis", "Tennis"], ["athletics", "Athletics / stopwatch"], ["chess", "Chess"],
  ["swimming", "Swimming"], ["squash", "Squash"], ["kabaddi", "Kabaddi"], ["trophy", "Trophy (any sport)"],
];

const DISPLAY_FONTS = ["Big Shoulders Display", "Anton", "Bebas Neue", "Oswald", "Barlow Condensed", "Teko", "Saira Extra Condensed"].map((f) => [f, f]);
const BODY_FONTS = ["Archivo", "Barlow", "Manrope", "DM Sans", "Work Sans", "Poppins", "Inter"].map((f) => [f, f]);

const SCHEMA = [
  /* ================= GENERAL ================= */
  {
    group: "General", id: "identity", title: "Site identity", page: "index.html", anchor: "#top",
    intro: "Your society's name, logo and address. These appear in the header, footer and loading screen.",
    fields: [
      { key: "site.logo", label: "Logo", type: "image", help: "Used in the header, footer, loading screen, page transition and browser tab. A square PNG works best." },
      { key: "site.name", label: "Full name", type: "text" },
      { key: "site.crestTop", label: "Header name (big line)", type: "text" },
      { key: "site.crestBottom", label: "Header name (small line)", type: "text" },
      { key: "site.university", label: "University", type: "text" },
      { key: "site.campus", label: "Campus", type: "text" },
      { key: "site.address", label: "Address", type: "text" },
    ],
  },
  {
    group: "General", id: "theme", title: "Colours & fonts", page: "index.html", anchor: "#top",
    intro: "The brand colours and fonts used across the whole site. Changes show in the preview straight away.",
    fields: [
      { key: "theme.sky", label: "Accent (sky blue)", type: "color", help: "Buttons, highlights, second line of big headings." },
      { key: "theme.ink", label: "Dark (ink)", type: "color", help: "Text, dark sections, footer." },
      { key: "theme.chalk", label: "Background (chalk)", type: "color" },
      { key: "theme.signal", label: "Alert (red)", type: "color", help: "“Upcoming” dots, errors, the SIX! stamp." },
      { key: "theme.displayFont", label: "Heading font", type: "select", half: true, options: DISPLAY_FONTS, help: "The big sporty headings." },
      { key: "theme.bodyFont", label: "Text font", type: "select", half: true, options: BODY_FONTS, help: "Paragraphs, buttons and labels." },
    ],
    actions: [{ label: "Reset to original colours & fonts", run: "resetTheme" }],
  },
  {
    group: "General", id: "social", title: "Social links", page: "index.html", anchor: "#top",
    intro: "Shown in the top bar and the footer. Add any network (TikTok, YouTube, WhatsApp…).",
    fields: [
      {
        key: "social.links", label: "Social links", type: "list", itemLabel: "link", titleKey: "label", subtitleKey: "url",
        item: { label: "New network", url: "https://" },
        fields: [
          { key: "label", label: "Name", type: "text", half: true },
          { key: "url", label: "Web address", type: "url", half: true },
        ],
      },
    ],
  },
  {
    group: "General", id: "topbar", title: "Announcement bar", page: "index.html", anchor: "#top",
    intro: "The thin dark strip at the very top of every page.",
    fields: [
      { key: "topbar.show", label: "Show the announcement bar", type: "toggle" },
      { key: "topbar.text", label: "Message", type: "text" },
      { key: "topbar.linkText", label: "Link text", type: "text" },
      { key: "topbar.link", label: "Link goes to", type: "url", help: "A page like recruitment.html, or a full web address." },
    ],
  },
  {
    group: "General", id: "nav", title: "Menu", page: "index.html", anchor: "#top",
    intro: "The links in the header. Add, rename, reorder or remove them.",
    fields: [
      {
        key: "nav.links", label: "Menu links", type: "list", itemLabel: "link", titleKey: "label", subtitleKey: "link",
        item: { label: "New link", link: "" },
        fields: [
          { key: "label", label: "Text", type: "text", half: true },
          { key: "link", label: "Goes to", type: "url", half: true, help: "A page (clubs.html), a section (index.html#sports) or a web address." },
        ],
      },
      { key: "nav.cta", label: "Highlighted button text", type: "text", half: true },
      { key: "nav.ctaLink", label: "Highlighted button link", type: "url", half: true },
    ],
  },
  {
    group: "General", id: "footer", title: "Footer", page: "index.html", anchor: "footer",
    intro: "Everything at the bottom of every page.",
    fields: [
      { key: "footer.mark", label: "Giant footer word", type: "text", help: "The huge faded text at the very bottom." },
      { key: "footer.copyright", label: "Copyright line", type: "text", help: "The year is added automatically in front." },
      { key: "footer.showAddress", label: "Show university and address", type: "toggle" },
      { key: "footer.showSocials", label: "Show social links", type: "toggle" },
      {
        key: "footer.links", label: "Footer links", type: "list", itemLabel: "link", titleKey: "label", subtitleKey: "link",
        item: { label: "New link", link: "" },
        fields: [
          { key: "label", label: "Text", type: "text", half: true },
          { key: "link", label: "Goes to", type: "url", half: true, help: "A page (clubs.html), a section (index.html#sports) or a web address." },
        ],
      },
    ],
    subsections: [{
      title: "Credit line",
      fields: [
        { key: "footer.credit.show", label: "Show the credit line", type: "toggle" },
        { key: "footer.credit.text", label: "Text", type: "text", half: true },
        { key: "footer.credit.linkText", label: "Link text", type: "text", half: true },
        { key: "footer.credit.url", label: "Link goes to", type: "url" },
      ],
    }],
  },
  {
    group: "General", id: "popup", title: "Popup", page: "index.html", anchor: "#top", previewExtra: "&popup=1",
    intro: "An image that pops up over the site, e.g. a recruitment poster. Visitors close it with the ✕; clicking the image opens the link.",
    fields: [
      { key: "popup.enabled", label: "Show the popup", type: "toggle" },
      { key: "popup.image", label: "Popup image", type: "image", help: "Any size works; it's scaled to fit the screen. Uploading a new image shows it again to everyone who closed the old one." },
      { key: "popup.link", label: "Clicking the image goes to", type: "url", help: "recruitment.html#applyForm opens the application form." },
      { key: "popup.alt", label: "Image description", type: "text", help: "Read out by screen readers, e.g. “Recruitment is open. Click to register.”" },
      { key: "popup.delay", label: "Appears after (seconds)", type: "number", min: 0, max: 30, half: true },
      { key: "popup.frequency", label: "After someone closes it", type: "select", half: true, options: [
        ["page", "Show again on every page"], ["session", "Show again next visit"], ["day", "Show again after a day"], ["once", "Never show again"],
      ] },
      { key: "popup.showOnHome", label: "Show on the home page", type: "toggle" },
      { key: "popup.showOnClubs", label: "Show on the clubs page", type: "toggle" },
      { key: "popup.showOnRecruitment", label: "Show on the recruitment page", type: "toggle" },
      { key: "popup.closeLabel", label: "Close button name", type: "text", help: "Read out by screen readers." },
    ],
  },
  {
    group: "General", id: "loader", title: "Loading screen", page: "index.html", anchor: "#top",
    intro: "The “On your marks, get set, go” intro that plays when someone opens the site.",
    fields: [
      { key: "loader.enabled", label: "Play the loading screen", type: "toggle" },
      { key: "loader.call1", label: "First call", type: "text" },
      { key: "loader.call2", label: "Second call", type: "text" },
      { key: "loader.call3", label: "Final call", type: "text" },
      { key: "loader.six", label: "Cricket stamp", type: "text" },
      { key: "loader.goal", label: "Football stamp", type: "text" },
      { key: "loader.time", label: "Stopwatch stops at (seconds)", type: "text", help: "9.58 is Usain Bolt's 100 m world record." },
    ],
    actions: [{ label: "Replay loading screen in preview", run: "replayIntro" }],
  },
  {
    group: "General", id: "labels", title: "Other labels", page: "index.html", anchor: "#top",
    intro: "Small words used around the site, including ones read out by screen readers.",
    fields: [
      { key: "ui.skip", label: "“Skip to content” link", type: "text", help: "Appears when using the keyboard." },
      { key: "ui.menu", label: "Mobile menu button", type: "text", help: "Read out by screen readers." },
      { key: "ui.closePhoto", label: "Close photo button", type: "text" },
    ],
  },
  {
    group: "General", id: "seo", title: "Search & sharing", page: "index.html", anchor: "#top",
    intro: "What Google shows, and the preview card when a link is shared on WhatsApp or social media.",
    fields: [
      { key: "seo.shareImage", label: "Share image", type: "image" },
      { key: "seo.homeTitle", label: "Home page title", type: "text" },
      { key: "seo.homeDescription", label: "Home page description", type: "textarea" },
      { key: "seo.clubsTitle", label: "Clubs page title", type: "text" },
      { key: "seo.clubsDescription", label: "Clubs page description", type: "textarea" },
      { key: "seo.recruitmentTitle", label: "Recruitment page title", type: "text" },
      { key: "seo.recruitmentDescription", label: "Recruitment page description", type: "textarea" },
    ],
  },

  /* ================= HOME ================= */
  {
    group: "Home page", id: "sections", title: "Show / hide sections", page: "index.html", anchor: "#top",
    intro: "Switch off any section to hide it from the home page. Its content is kept, so you can switch it back on later.",
    fields: [
      { key: "home.sections.strip", label: "Scrolling sports strip", type: "toggle" },
      { key: "home.sections.society", label: "The Society", type: "toggle" },
      { key: "home.sections.sports", label: "Sports", type: "toggle" },
      { key: "home.sections.fixtures", label: "Fixtures & results", type: "toggle" },
      { key: "home.sections.council", label: "Council", type: "toggle" },
      { key: "home.sections.clubsTeaser", label: "Clubs section", type: "toggle" },
      { key: "home.sections.gallery", label: "Gallery", type: "toggle" },
      { key: "home.sections.join", label: "Join banner", type: "toggle" },
    ],
  },
  {
    group: "Home page", id: "hero", title: "Hero", page: "index.html", anchor: "#top",
    fields: [
      { key: "home.hero.line1", label: "Headline, line 1", type: "text" },
      { key: "home.hero.line2", label: "Headline, line 2 (blue)", type: "text" },
      { key: "home.hero.intro", label: "Intro paragraph", type: "textarea" },
      { key: "home.hero.primaryCta", label: "Main button text", type: "text" },
      { key: "home.hero.primaryLink", label: "Main button link", type: "url" },
      { key: "home.hero.secondaryCta", label: "Second button text", type: "text" },
      { key: "home.hero.secondaryLink", label: "Second button link", type: "url" },
    ],
    subsections: [{
      title: "Countdown card labels",
      help: "The countdown always shows the nearest upcoming fixture. Edit fixtures under Home page → Fixtures.",
      fields: [
        { key: "home.nextUp.label", label: "Card label", type: "text" },
        { key: "home.nextUp.detailsLink", label: "Details link text", type: "text" },
        { key: "home.nextUp.days", label: "“Days”", type: "text" },
        { key: "home.nextUp.hours", label: "“Hours”", type: "text" },
        { key: "home.nextUp.minutes", label: "“Minutes”", type: "text" },
        { key: "home.nextUp.seconds", label: "“Seconds”", type: "text" },
        { key: "home.nextUp.emptyLabel", label: "Label when nothing is scheduled", type: "text" },
        { key: "home.nextUp.emptyTitle", label: "Title when nothing is scheduled", type: "text" },
        { key: "home.nextUp.emptyText", label: "Text when nothing is scheduled", type: "text" },
        { key: "home.nextUp.emptyLink", label: "Link text when nothing is scheduled", type: "text", half: true },
        { key: "home.nextUp.emptyUrl", label: "Link when nothing is scheduled", type: "url", half: true },
      ],
    }],
  },
  {
    group: "Home page", id: "society", title: "The Society", page: "index.html", anchor: "#club",
    fields: [
      { key: "home.society.kicker", label: "Small label", type: "text" },
      { key: "home.society.title", label: "Heading", type: "textarea", rows: 2, help: "Press Enter for a line break." },
      { key: "home.society.text", label: "Paragraph", type: "textarea" },
      {
        key: "home.society.items", label: "What we run", type: "list", itemLabel: "item", titleKey: "title",
        item: { title: "New item", text: "" },
        fields: [{ key: "title", label: "Title", type: "text" }, { key: "text", label: "Description", type: "textarea" }],
      },
    ],
  },
  {
    group: "Home page", id: "sports", title: "Sports", page: "index.html", anchor: "#sports",
    fields: [
      { key: "home.sports.kicker", label: "Small label", type: "text" },
      { key: "home.sports.title", label: "Heading", type: "text" },
      { key: "home.sports.allLabel", label: "“All” filter label", type: "text" },
      {
        key: "home.sports.items", label: "Sports", type: "list", itemLabel: "sport", titleKey: "name",
        help: "Filter tabs are made automatically from the categories you use.",
        item: { name: "New sport", category: "Team", format: "", icon: "trophy" },
        fields: [
          { key: "name", label: "Name", type: "text" },
          { key: "category", label: "Category", type: "text", suggestions: ["Team", "Racquet", "Individual", "Mind"] },
          { key: "format", label: "Format", type: "text", help: "e.g. 11-a-side, Singles · Doubles" },
          { key: "icon", label: "Icon", type: "select", options: SPORT_ICON_OPTIONS },
        ],
      },
    ],
  },
  {
    group: "Home page", id: "fixtures", title: "Fixtures & results", page: "index.html", anchor: "#fixtures",
    fields: [
      {
        key: "home.fixtures.items", label: "Events", type: "list", itemLabel: "event", titleKey: "title", subtitleKey: "date",
        help: "Set status to “Upcoming” for future events; the nearest one appears in the hero countdown.",
        item: { title: "New event", tag: "", date: "", time: "", venue: "", status: "upcoming", description: "", link: "", linkText: "" },
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "tag", label: "Tag", type: "text", help: "Small label above the title, e.g. Sports Week" },
          { key: "date", label: "Date", type: "date", half: true },
          { key: "time", label: "Time", type: "time", half: true },
          { key: "venue", label: "Venue", type: "text" },
          { key: "status", label: "Status", type: "select", options: [["upcoming", "Upcoming"], ["past", "Result / finished"]] },
          { key: "description", label: "Description", type: "textarea" },
          { key: "link", label: "Link", type: "url", help: "Optional. Where the row and the countdown's button go." },
          { key: "linkText", label: "Countdown button text", type: "text", help: "Optional. Defaults to the countdown's details link text." },
        ],
      },
      { key: "home.fixtures.kicker", label: "Small label", type: "text" },
      { key: "home.fixtures.title", label: "Heading", type: "text" },
      { key: "home.fixtures.tabUpcoming", label: "“Upcoming” tab", type: "text", half: true },
      { key: "home.fixtures.tabResults", label: "“Results” tab", type: "text", half: true },
      { key: "home.fixtures.tabAll", label: "“All” tab", type: "text", half: true },
      { key: "home.fixtures.upcomingLabel", label: "Upcoming status label", type: "text", half: true },
      { key: "home.fixtures.resultLabel", label: "Finished status label", type: "text", half: true },
      { key: "home.fixtures.resultBadge", label: "Finished badge", type: "text", half: true, help: "The dark box before the label, e.g. FT" },
      { key: "home.fixtures.emptyText", label: "Message when the list is empty", type: "text" },
    ],
  },
  {
    group: "Home page", id: "council", title: "Council", page: "index.html", anchor: "#squad",
    fields: [
      {
        key: "home.council.members", label: "Members", type: "list", itemLabel: "member", titleKey: "name", subtitleKey: "role",
        help: "With no photo, the member is shown as a jersey with the shirt name and number.",
        item: { name: "New member", role: "", shirt: "", number: "", photo: "" },
        fields: [
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Role", type: "text" },
          { key: "shirt", label: "Name on shirt", type: "text", half: true, help: "Short, e.g. surname" },
          { key: "number", label: "Shirt number", type: "text", half: true },
          { key: "photo", label: "Photo (optional)", type: "image" },
        ],
      },
      { key: "home.council.topRow", label: "Members in top row", type: "number", min: 0, max: 12, help: "The first members in the list sit on their own centred row (e.g. 3 on top, 5 below). Use 0 for even rows." },
      { key: "home.council.kicker", label: "Small label", type: "text" },
      { key: "home.council.title", label: "Heading", type: "text" },
      { key: "home.council.text", label: "Paragraph", type: "textarea" },
    ],
  },
  {
    group: "Home page", id: "clubsTeaser", title: "Clubs section", page: "index.html", anchor: "#clubs",
    intro: "The dark scoreboard section on the home page. The clubs themselves are edited under Clubs page → Clubs.",
    fields: [
      { key: "home.clubsTeaser.kicker", label: "Small label", type: "text" },
      { key: "home.clubsTeaser.title", label: "Heading", type: "textarea", rows: 2 },
      { key: "home.clubsTeaser.text", label: "Paragraph", type: "textarea" },
      { key: "home.clubsTeaser.cta", label: "Button text", type: "text", half: true },
      { key: "home.clubsTeaser.link", label: "Button link", type: "url", half: true },
    ],
  },
  {
    group: "Home page", id: "gallery", title: "Gallery", page: "index.html", anchor: "#gallery",
    fields: [
      {
        key: "home.gallery.items", label: "Photos", type: "list", itemLabel: "photo", titleKey: "caption",
        help: "The first photo is shown large. Tiles without a photo show a “photo to come” frame.",
        item: { src: "", caption: "" },
        fields: [{ key: "src", label: "Photo", type: "image" }, { key: "caption", label: "Caption", type: "text" }],
      },
      { key: "home.gallery.kicker", label: "Small label", type: "text" },
      { key: "home.gallery.title", label: "Heading", type: "text" },
      { key: "home.gallery.linkText", label: "Top-right link text", type: "text", half: true },
      { key: "home.gallery.link", label: "Top-right link", type: "url", half: true },
      { key: "home.gallery.emptyTag", label: "Empty tile label", type: "text" },
    ],
  },
  {
    group: "Home page", id: "join", title: "Join banner", page: "index.html", anchor: "#join",
    fields: [
      { key: "home.join.title", label: "Big heading", type: "textarea", rows: 2 },
      { key: "home.join.text", label: "Paragraph", type: "textarea" },
      { key: "home.join.primaryCta", label: "Main button", type: "text", half: true },
      { key: "home.join.primaryLink", label: "Main button link", type: "url", half: true },
      { key: "home.join.secondaryCta", label: "Second button", type: "text", half: true },
      { key: "home.join.secondaryLink", label: "Second button link", type: "url", half: true },
    ],
  },

  /* ================= CLUBS PAGE ================= */
  {
    group: "Clubs page", id: "clubsList", title: "Clubs", page: "clubs.html", anchor: "#main",
    intro: "These clubs also fill the home page scoreboard and the recruitment form's club dropdowns.",
    fields: [
      {
        key: "clubs", label: "Clubs", type: "list", itemLabel: "club", titleKey: "name", subtitleKey: "code",
        item: { id: "new-club", code: "NEW", name: "New Club", image: "", tagline: "", description: "", does: [], fit: [] },
        fields: [
          { key: "name", label: "Club name", type: "text" },
          { key: "code", label: "Scoreboard code", type: "text", half: true, help: "3 letters, e.g. MED" },
          { key: "id", label: "Link id", type: "text", half: true, help: "Lowercase, no spaces (clubs.html#media)" },
          { key: "tagline", label: "Tagline", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "image", label: "Photo (optional)", type: "image" },
          { key: "does", label: "What you'll do", type: "strings", itemLabel: "point" },
          { key: "fit", label: "Good fit tags", type: "strings", itemLabel: "tag" },
        ],
      },
    ],
  },
  {
    group: "Clubs page", id: "clubsPage", title: "Page text", page: "clubs.html", anchor: "#main",
    fields: [
      { key: "clubsPage.kicker", label: "Small label", type: "text" },
      { key: "clubsPage.line1", label: "Headline, line 1", type: "text" },
      { key: "clubsPage.line2", label: "Headline, line 2 (blue)", type: "text" },
      { key: "clubsPage.intro", label: "Intro paragraph", type: "textarea" },
      { key: "clubsPage.cta", label: "Button text", type: "text", half: true },
      { key: "clubsPage.ctaLink", label: "Button link (top and bottom)", type: "url", half: true },
      { key: "clubsPage.countLabel", label: "Club counter", type: "text", help: "Use {n} and {total}, e.g. Club {n} of {total}" },
      { key: "clubsPage.doesLabel", label: "“What you'll do” label", type: "text" },
      { key: "clubsPage.fitLabel", label: "“Good fit” label", type: "text" },
      { key: "clubsPage.applyLabel", label: "Apply button prefix", type: "text", help: "Shown as “Apply to Media Club”." },
      { key: "clubsPage.joinTitle", label: "Bottom banner heading", type: "textarea", rows: 2 },
      { key: "clubsPage.joinText", label: "Bottom banner paragraph", type: "textarea" },
      { key: "clubsPage.joinCta", label: "Bottom banner button", type: "text" },
    ],
  },

  /* ================= RECRUITMENT ================= */
  {
    group: "Recruitment", id: "recruitStatus", title: "Status & applications", page: "recruitment.html", anchor: "#main",
    fields: [
      { key: "recruitment.open", label: "Recruitment is open", type: "toggle", help: "Turn off to replace the form with the “closed” message." },
      { key: "recruitment.closedTitle", label: "Closed heading", type: "text" },
      { key: "recruitment.closedText", label: "Closed message", type: "textarea" },
      { key: "recruitment.closedCta", label: "Closed button text", type: "text", half: true },
      { key: "recruitment.closedLink", label: "Closed button link", type: "url", half: true },
      { key: "recruitment.endpoint", label: "Google Sheet web-app link", type: "url", help: "The Apps Script /exec link that saves applications (see apps-script/SETUP.md)." },
      { key: "recruitment.sheetUrl", label: "Applications sheet (for you)", type: "url", help: "Paste your Google Sheet's link to open it from here. Not shown on the site." },
    ],
    actions: [{ label: "Open applications sheet", run: "openSheet" }],
  },
  {
    group: "Recruitment", id: "recruitPage", title: "Page text", page: "recruitment.html", anchor: "#main",
    fields: [
      { key: "recruitment.kicker", label: "Small label", type: "text" },
      { key: "recruitment.line1", label: "Headline, line 1", type: "text" },
      { key: "recruitment.line2", label: "Headline, line 2 (blue)", type: "text" },
      { key: "recruitment.lead", label: "Intro", type: "textarea" },
      { key: "recruitment.stepsTitle", label: "Steps heading", type: "text" },
      {
        key: "recruitment.steps", label: "Steps", type: "list", itemLabel: "step", titleKey: "title",
        item: { title: "New step", text: "" },
        fields: [{ key: "title", label: "Title", type: "text" }, { key: "text", label: "Description", type: "textarea" }],
      },
      { key: "recruitment.help", label: "Help line", type: "text" },
      { key: "recruitment.helpLinkText", label: "Help link text", type: "text", half: true },
      { key: "recruitment.helpLink", label: "Help link", type: "url", half: true },
    ],
  },
  {
    group: "Recruitment", id: "recruitForm", title: "Form", page: "recruitment.html", anchor: "#applyForm",
    fields: [
      { key: "recruitment.departments", label: "Departments (dropdown)", type: "strings", itemLabel: "department" },
      { key: "recruitment.form.semesters", label: "Number of semesters", type: "number", min: 1, max: 12 },
      { key: "recruitment.form.title", label: "Form title", type: "text" },
      { key: "recruitment.form.requiredNote", label: "Required note", type: "text" },
      { key: "recruitment.form.sectionDetails", label: "Section 1 heading", type: "text", half: true },
      { key: "recruitment.form.sectionAcademic", label: "Section 2 heading", type: "text", half: true },
      { key: "recruitment.form.sectionClubs", label: "Section 3 heading", type: "text", half: true },
      { key: "recruitment.form.sectionPitch", label: "Section 4 heading", type: "text", half: true },
      { key: "recruitment.form.name", label: "Name label", type: "text", half: true },
      { key: "recruitment.form.contact", label: "Contact label", type: "text", half: true },
      { key: "recruitment.form.email", label: "Email label", type: "text", half: true },
      { key: "recruitment.form.regNo", label: "Registration no. label", type: "text", half: true },
      { key: "recruitment.form.regHint", label: "Registration no. hint", type: "text" },
      { key: "recruitment.form.department", label: "Department label", type: "text", half: true },
      { key: "recruitment.form.semester", label: "Semester label", type: "text", half: true },
      { key: "recruitment.form.preferredClub", label: "Preferred club label", type: "text", half: true },
      { key: "recruitment.form.secondaryClub", label: "Secondary club label", type: "text", half: true },
      { key: "recruitment.form.why", label: "Question label", type: "text" },
      { key: "recruitment.form.whyHint", label: "Question hint", type: "text" },
      { key: "recruitment.form.submit", label: "Submit button", type: "text", half: true },
      { key: "recruitment.form.submitting", label: "Submit button while sending", type: "text", half: true },
    ],
    subsections: [{
      title: "Placeholders (grey hint text inside fields)",
      fields: [
        { key: "recruitment.form.namePlaceholder", label: "Name", type: "text", half: true },
        { key: "recruitment.form.contactPlaceholder", label: "Contact number", type: "text", half: true },
        { key: "recruitment.form.emailPlaceholder", label: "Email", type: "text", half: true },
        { key: "recruitment.form.regPlaceholder", label: "Registration number", type: "text", half: true },
        { key: "recruitment.form.selectDepartment", label: "Department dropdown", type: "text", half: true },
        { key: "recruitment.form.selectSemester", label: "Semester dropdown", type: "text", half: true },
        { key: "recruitment.form.selectClub", label: "Club dropdowns", type: "text", half: true },
      ],
    }],
  },
  {
    group: "Recruitment", id: "recruitMessages", title: "Error messages", page: "recruitment.html", anchor: "#applyForm",
    intro: "What applicants see when something needs fixing. {count} and {regNo} are filled in automatically.",
    fields: [
      { key: "recruitment.messages.name", label: "Name missing", type: "text" },
      { key: "recruitment.messages.contact", label: "Wrong contact number", type: "text" },
      { key: "recruitment.messages.email", label: "Wrong email", type: "text" },
      { key: "recruitment.messages.regNo", label: "Wrong registration number", type: "text" },
      { key: "recruitment.messages.department", label: "No department", type: "text" },
      { key: "recruitment.messages.semester", label: "No semester", type: "text" },
      { key: "recruitment.messages.preferredClub", label: "No preferred club", type: "text" },
      { key: "recruitment.messages.secondaryClub", label: "No secondary club", type: "text" },
      { key: "recruitment.messages.secondarySame", label: "Same club picked twice", type: "text" },
      { key: "recruitment.messages.why", label: "Answer too short", type: "text" },
      { key: "recruitment.messages.fixOne", label: "One field to fix", type: "text" },
      { key: "recruitment.messages.fixMany", label: "Several fields to fix", type: "text" },
      { key: "recruitment.messages.duplicate", label: "Already applied", type: "textarea" },
      { key: "recruitment.messages.failed", label: "Sending failed", type: "textarea" },
      { key: "recruitment.messages.notConnected", label: "Form not connected yet", type: "textarea" },
    ],
  },
  {
    group: "Recruitment", id: "recruitSuccess", title: "Success message", page: "recruitment.html", anchor: "#main",
    intro: "Shown after someone applies. Use {first}, {name}, {club}, {second}, {contact}, {email} or {regNo} to insert their details.",
    fields: [
      { key: "recruitment.successKicker", label: "Small label", type: "text" },
      { key: "recruitment.successTitle", label: "Heading", type: "text" },
      { key: "recruitment.successText", label: "Message", type: "textarea" },
      { key: "recruitment.successHome", label: "First button", type: "text", half: true },
      { key: "recruitment.successClubs", label: "Second button", type: "text", half: true },
    ],
  },

  /* ================= TOOLS ================= */
  { group: "Tools", id: "media", title: "Media library", tool: "media", intro: "Every image you've uploaded. Delete images you no longer use." },
  { group: "Tools", id: "history", title: "Version history", tool: "history", intro: "Every publish is saved. Load an older version to review it, then publish to restore it." },
  { group: "Tools", id: "backup", title: "Backup", tool: "backup", intro: "Download all content as a file, or restore from one." },
];

const DEFAULT_THEME = { sky: "#0fa3e6", ink: "#0a1420", chalk: "#f2f4f5", signal: "#e1261c", displayFont: "Big Shoulders Display", bodyFont: "Archivo" };
