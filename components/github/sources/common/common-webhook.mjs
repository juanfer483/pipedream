import github from "../../github.app.mjs";

export default {
  props: {
    github,
    repoFullname: {
      label: "Repository",
      description: "The name of the repository. The name is not case sensitive",
      type: "string",
      propDefinition: [
        github,
        "repoFullname",
      ],
    },
    orgName: {
      propDefinition: [
        github,
        "orgName",
      ],
      optional: true,
    },
    packageType: {
      propDefinition: [
        github,
        "packageType",
      ],
      optional: true,
    },
    db: "$.service.db",
    http: "$.interface.http",
  },
  methods: {
    _getWebhookId() {
      return this.db.get("webhookId");
    },
    _setWebhookId(webhookId) {
      this.db.set("webhookId", webhookId);
    },
    getWebhookEvents() {
      throw new Error("getWebhookEvents is not implemented");
    },
  },
  hooks: {
    async deploy() {
      // Retrieve historical events
      const events = await this.loadHistoricalData();
      if (events) {
        for (const event of events) {
          this.$emit(event.main, event.sub);
        }
      }
    },
    async activate() {
      const response = await this.github.createWebhook({
        repoFullname: this.repoFullname,
        data: {
          name: "web",
          config: {
            url: this.http.endpoint,
            content_type: "json",
          },
          events: this.getWebhookEvents(),
        },
      });
      this._setWebhookId(response.id);
    },
    async deactivate() {
      const webhookId = this._getWebhookId();
      await this.github.removeWebhook({
        repoFullname: this.repoFullname,
        webhookId,
      });
    },
  },
};
