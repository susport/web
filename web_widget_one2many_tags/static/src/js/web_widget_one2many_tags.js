//-*- coding: utf-8 -*-
//?? 2016 Therp BV <http://therp.nl>
//License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

openerp.web_widget_one2many_tags = function(instance)
{
    openerp.web_widget_one2many_tags.FieldOne2ManyTags =
    instance.web.form.FieldOne2Many.extend(instance.web.form.ReinitializeFieldMixin, {
        template: "FieldOne2ManyTags",
        tag_template: "FieldOne2ManyTag",
        disable_utility_classes: false,
        initialize_texttext: function()
        {
            var self = this;
            return {
                plugins: 'tags arrow filter',
                ext: {
                    itemManager: {
                        itemToString: function(item) {
                            return item.name;
                        },
                    },
                    arrow: {
                        onArrowClick: function(e)
                        {
                            var list_view = new instance.web.form.One2ManyListView(
                                self, self.dataset);
                            list_view.o2m = self;
                            list_view.editable = function() { return false };
                            list_view.do_add_record();
                        },
                    },
                    tags: {
                        isTagAllowed: function(tag) {
                            return tag.name;
                        },
                        removeTag: function(tag)
                        {
                            self.dataset.unlink([tag.data('id')]);
                            return $.fn.textext.TextExtTags.prototype.removeTag
                                .call(this, tag);
                        },
                        renderTag: function(tag) {
                            return $.fn.textext.TextExtTags.prototype.renderTag
                                .call(this, tag).data("id", tag.id);
                        },
                    },
                },
                filter: {
                    items: []
                },
            };
        },
        build_context: function()
        {
            var context = this._super.apply(this, arguments),
                key = _.str.sprintf('default_%s', this.field.relation_field);
            context.add({[key]: this.field_manager.datarecord.id});
            return context;
        },
        reload_current_view: function()
        {
            var self = this;
            if(!self.$el.length)
            {
                return jQuery.when();
            }
            if(!self.get("effective_readonly"))
            {
                self.ignore_blur = false;
                if(self.tags)
                {
                    self.tags.tagElements().remove();
                }
                if(!self.$text || !self.$text.length)
                {
                    self.$text = this.$("textarea");
                    self.$text.textext(self.initialize_texttext());
                    self.$text.bind('tagClick', function(e, tag, value, callback)
                    {
                        var list_view = new instance.web.form.One2ManyViewManager(
                            self, self.dataset);
                        list_view.o2m = self;
                        self.dataset.select_id(value.id);
                        list_view.switch_mode('form');
                    });
                }
                if(self.$text.textext().length)
                {
                    self.tags = self.$text.textext()[0].tags();
                }
            }
            else
            {
                self.tags = null;
                self.$text = null;
            }
            return self.dataset.read_ids(self.dataset.ids, ['display_name'])
            .then(function(names)
            {
                if(self.get("effective_readonly"))
                {
                    self.$el.html(instance.web.qweb.render(
                        self.tag_template,
                        {
                            elements: _(names).map(function(name)
                            {
                                return [name.id, name.display_name];
                            })
                        }
                    ));
                }
                else if(self.$text.textext().length)
                {
                    self.tags.addTags(_(names).map(function(name)
                    {
                        return {
                            name: name.display_name || instance.web._t('New record'),
                            id: name.id,
                        }
                    }));
                }
            });
        },
        reinitialize: function()
        {
            var result = instance.web.form.ReinitializeFieldMixin.reinitialize.call(this);
            this.reload_current_view();
            return result;
        },
        // defuse some functions we don't need
        get_active_view: function()
        {
            return false;
        },
        load_views: function()
        {
            return jQuery.when();
        },
    });

    instance.web.form.widgets.add(
        'one2many_tags',
        'instance.web_widget_one2many_tags.FieldOne2ManyTags'
    );

    instance.web.list.One2ManyTags = instance.web.list.Many2Many.extend({
        init: function () {
            this._super.apply(this, arguments);
            // Treat it as many2many to trick odoo into populating '__display'.
            // note: this has been fixed in core OCB recently
            this.type = 'many2many';
        },
        _format: function (row_data, options) {
            if (_.isEmpty(row_data[this.id].value)) {
                row_data[this.id] = {'value': false};
            }
            return this._super(row_data, options);
        }
    });

    instance.web.list.columns.add(
        'field.one2many_tags',
        'instance.web.list.One2ManyTags'
    );
}
