'use strict';

/**
 * Upload.js controller
 *
 * @description: A set of functions called "actions" of the `upload` plugin.
 */

const _ = require('lodash');

module.exports = {
  async upload(ctx) {
    const uploadService = strapi.plugins.upload.services.upload;

    // Retrieve provider configuration.
    const config = await strapi
      .store({
        environment: strapi.config.environment,
        type: 'plugin',
        name: 'upload',
      })
      .get({ key: 'provider' });

    // Verify if the file upload is enable.
    if (config.enabled === false) {
      return ctx.badRequest(
        null,

        [
          {
            messages: [
              {
                id: 'Upload.status.disabled',
                message: 'File upload is disabled',
              },
            ],
          },
        ]
      );
    }

    // Extract optional relational data.
    const { refId, ref, source, field, path } = ctx.request.body || {};
    const { files = {} } = ctx.request.files || {};

    if (_.isEmpty(files)) {
      return ctx.badRequest(null, [
        {
          messages: [{ id: 'Upload.status.empty', message: 'Files are empty' }],
        },
      ]);
    }

    // Transform stream files to buffer
    const buffers = await uploadService.bufferize(files);

    const enhancedFiles = buffers.map(file => {
      if (file.size > config.sizeLimit) {
        return ctx.badRequest(null, [
          {
            messages: [
              {
                id: 'Upload.status.sizeLimit',
                message: `${file.name} file is bigger than limit size!`,
                values: { file: file.name },
              },
            ],
          },
        ]);
      }

      // Add details to the file to be able to create the relationships.
      if (refId && ref && field) {
        Object.assign(file, {
          related: [
            {
              refId,
              ref,
              source,
              field,
            },
          ],
        });
      }

      // Update uploading folder path for the file.
      if (path) {
        Object.assign(file, {
          path,
        });
      }

      return file;
    });

    // Something is wrong (size limit)...
    if (ctx.status === 400) {
      return;
    }

    const uploadedFiles = await uploadService.upload(enhancedFiles, config);

    // send an email if it is a message content-type
    if (ref === "message") {
      const message = await strapi.query(ref).find({ id: refId });
      const Message = message[0];

      const attachments = Message.files.map(file => {
        return {
          filename: file.name,
          path: `public${file.url}`,
        }
      })

      await strapi.plugins['email'].services.email.send({
        to: 'contact@citycheck.fr',
        from: message[0].email,
        subject: `Message de ${message[0].name} depuis citycheck.fr`,
        text: `${message[0].message}`,
        attachments: attachments
      });
    }

    // Send 200 `ok`
    ctx.send(
      uploadedFiles.map(file => {
        // If is local server upload, add backend host as prefix
        if (file.url && file.url[0] === '/') {
          file.url = strapi.config.url + file.url;
        }

        if (_.isArray(file.related)) {
          file.related = file.related.map(obj => obj.ref || obj);
        }

        return file;
      })
    );
  },

  async getEnvironments(ctx) {
    console.log(strapi.config);
    const environments = Object.keys(strapi.config.environments).map(
      environment => ({
        name: environment,
        active: strapi.config.environment === environment,
      })
    );

    ctx.send({ environments });
  },

  async getSettings(ctx) {
    const config = await strapi
      .store({
        environment: ctx.params.environment,
        type: 'plugin',
        name: 'upload',
      })
      .get({ key: 'provider' });

    ctx.send({
      providers: strapi.plugins.upload.config.providers,
      config,
    });
  },

  async updateSettings(ctx) {
    await strapi
      .store({
        environment: ctx.params.environment,
        type: 'plugin',
        name: 'upload',
      })
      .set({ key: 'provider', value: ctx.request.body });

    ctx.send({ ok: true });
  },

  async find(ctx) {
    const data = await strapi.plugins['upload'].services.upload.fetchAll(
      ctx.query
    );

    // Send 200 `ok`
    ctx.send(
      data.map(file => {
        // if is local server upload, add backend host as prefix
        if (file.url[0] === '/') {
          file.url = strapi.config.url + file.url;
        }

        return file;
      })
    );
  },

  async findOne(ctx) {
    const data = await strapi.plugins['upload'].services.upload.fetch(
      ctx.params
    );

    if (!data) {
      return ctx.notFound('file.notFound');
    }

    // if is local server upload, add backend host as prefix
    if (data.url[0] === '/') {
      data.url = strapi.config.url + data.url;
    }

    ctx.send(data);
  },

  async count(ctx) {
    const data = await strapi.plugins['upload'].services.upload.count(
      ctx.query
    );

    ctx.send({ count: data });
  },

  async destroy(ctx) {
    const { id } = ctx.params;
    const config = await strapi
      .store({
        environment: strapi.config.environment,
        type: 'plugin',
        name: 'upload',
      })
      .get({ key: 'provider' });

    const file = await strapi.plugins['upload'].services.upload.fetch({ id });

    if (!file) {
      return ctx.notFound('file.notFound');
    }

    await strapi.plugins['upload'].services.upload.remove(file, config);

    ctx.send(file);
  },

  async search(ctx) {
    const { id } = ctx.params;

    const data = await strapi.query('file', 'upload').custom(searchQueries)({
      id,
    });

    ctx.send(data);
  },
};

const searchQueries = {
  bookshelf({ model }) {
    return ({ id }) => {
      return model
        .query(qb => {
          qb.whereRaw('LOWER(hash) LIKE ?', [`%${id}%`]).orWhereRaw(
            'LOWER(name) LIKE ?',
            [`%${id}%`]
          );
        })
        .fetchAll()
        .then(results => results.toJSON());
    };
  },
  mongoose({ model }) {
    return ({ id }) => {
      const re = new RegExp(id, 'i');

      return model.find({
        $or: [{ hash: re }, { name: re }],
      });
    };
  },
};
