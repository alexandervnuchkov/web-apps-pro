/*
 *
 * (c) Copyright Ascensio System Limited 2010-2017
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at Lubanas st. 125a-25, Riga, Latvia,
 * EU, LV-1021.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

/**
 *
 * PageLayout.js
 *
 * PageLayout controller
 *
 * Extra controller for toolbar
 *
 * Created by Maxim.Kadushkin on 3/31/2017.
 */

define([
    'core'
], function () {
    'use strict';

    DE.Controllers.PageLayout = Backbone.Controller.extend((function(){
        var _imgOriginalProps;

        return {
            initialize: function () {
                this.addListeners({
                    'Toolbar': {
                        'insert:break': function () {
                            console.log('insert page break');
                        }
                    }
                });
            },

            onLaunch: function (view) {
                this.toolbar = view;
                this.editMode = true;

                return this;
            },

            onAppReady: function (config) {
                var me = this;

                me.toolbar.btnImgAlign.menu.on('item:click', me.onClickMenuAlign.bind(me));
                me.toolbar.btnImgWrapping.menu.on('item:click', me.onClickMenuWrapping.bind(me));
                me.toolbar.btnImgGroup.menu.on('item:click', me.onClickMenuGroup.bind(me));
                me.toolbar.btnImgForward.menu.on('item:click', me.onClickMenuForward.bind(me));
                me.toolbar.btnImgBackward.menu.on('item:click', me.onClickMenuForward.bind(me));

                me.toolbar.btnImgForward.on('click', me.onClickMenuForward.bind(me, 'forward'));
                me.toolbar.btnImgBackward.on('click', me.onClickMenuForward.bind(me, 'backward'));

                me.toolbar.btnsPageBreak.forEach( function(btn) {
                    var _menu_section_break = btn.menu.items[2].menu;
                    _menu_section_break.on('item:click', function (menu, item, e) {
                        me.toolbar.fireEvent('insert:break', [item.value]);
                    });

                    btn.menu.on('item:click', function (menu, item, e) {
                        if ( !(item.value == 'section') )
                            me.toolbar.fireEvent('insert:break', [item.value]);
                    });

                    btn.on('click', function(e) {
                        me.toolbar.fireEvent('insert:break', ['page']);
                    });
                });

            },

            setApi: function (api) {
                this.api = api;

                this.api.asc_registerCallback('asc_onImgWrapStyleChanged', this.onApiWrappingStyleChanged.bind(this));
                this.api.asc_registerCallback('asc_onCoAuthoringDisconnect', this.onApiCoAuthoringDisconnect.bind(this));
                this.api.asc_registerCallback('asc_onFocusObject', this.onApiFocusObject.bind(this));

                return this;
            },

            onApiWrappingStyleChanged: function (type) {
                var menu = this.toolbar.btnImgWrapping.menu;

                switch ( type ) {
                case Asc.c_oAscWrapStyle2.Inline:       menu.items[0].setChecked(true); break;
                case Asc.c_oAscWrapStyle2.Square:       menu.items[1].setChecked(true); break;
                case Asc.c_oAscWrapStyle2.Tight:        menu.items[2].setChecked(true); break;
                case Asc.c_oAscWrapStyle2.Through:      menu.items[3].setChecked(true); break;
                case Asc.c_oAscWrapStyle2.TopAndBottom: menu.items[4].setChecked(true); break;
                case Asc.c_oAscWrapStyle2.Behind:       menu.items[6].setChecked(true); break;
                case Asc.c_oAscWrapStyle2.InFront:      menu.items[5].setChecked(true); break;
                default:
                    for (var i in menu.items) {
                        menu.items[i].setChecked( false );
                    }
                }
            },

            onApiFocusObject: function(objects) {
                if (!this.editMode) return;

                var me = this;
                var disable = [], type;

                for (var i in objects) {
                    type = objects[i].get_ObjectType();
                    if ( type === Asc.c_oAscTypeSelectElement.Image ) {
                        var props = objects[i].get_ObjectValue();
                        var islocked = props.get_Locked();
                        var notflow = !props.get_CanBeFlow();

                        var wrapping = props.get_WrappingStyle();
                        me.onApiWrappingStyleChanged(notflow ? -1 : wrapping);

                        _.each(me.toolbar.btnImgWrapping.menu.items, function(item) {
                            item.setDisabled(notflow);
                        });

                        disable.align       = islocked || wrapping == Asc.c_oAscWrapStyle2.Inline;
                        disable.group       = islocked || wrapping == Asc.c_oAscWrapStyle2.Inline;
                        disable.arrange     = wrapping == Asc.c_oAscWrapStyle2.Inline;
                        disable.wrapping    = islocked || props.get_FromGroup() || (notflow && !me.api.CanChangeWrapPolygon());

                        if ( !disable.group ) {
                            if (me.api.CanGroup() || me.api.CanUnGroup()) {
                                var mnuGroup = me.toolbar.btnImgGroup.menu.items[0],
                                    mnuUnGroup = me.toolbar.btnImgGroup.menu.items[1];

                                mnuGroup.setDisabled(!me.api.CanGroup());
                                mnuUnGroup.setDisabled(!me.api.CanUnGroup());
                            } else
                                disable.group = true;
                        }

                        _imgOriginalProps = props;
                        break;
                    }
                }

                me.toolbar.btnImgAlign.setDisabled(disable.align !== false);
                me.toolbar.btnImgGroup.setDisabled(disable.group !== false);
                me.toolbar.btnImgForward.setDisabled(disable.arrange !== false);
                me.toolbar.btnImgBackward.setDisabled(disable.arrange !== false);
                me.toolbar.btnImgWrapping.setDisabled(disable.wrapping !== false);
            },

            onApiCoAuthoringDisconnect: function() {
                var me = this;
                me.editMode = false;

                me.toolbar.btnImgAlign.setDisabled(true);
                me.toolbar.btnImgGroup.setDisabled(true);
                me.toolbar.btnImgForward.setDisabled(true);
                me.toolbar.btnImgBackward.setDisabled(true);
                me.toolbar.btnImgWrapping.setDisabled(true);
            },

            onClickMenuAlign: function (menu, item, e) {
                var props = new Asc.asc_CImgProperty();
                if ( !_.isUndefined(item.options.halign) ) {
                    props.put_PositionH(new Asc.CImagePositionH());
                    props.get_PositionH().put_UseAlign(true);
                    props.get_PositionH().put_Align(item.options.halign);
                    props.get_PositionH().put_RelativeFrom(Asc.c_oAscRelativeFromH.Margin);
                } else {
                    props.put_PositionV(new Asc.CImagePositionV());
                    props.get_PositionV().put_UseAlign(true);
                    props.get_PositionV().put_Align(item.options.valign);
                    props.get_PositionV().put_RelativeFrom(Asc.c_oAscRelativeFromV.Margin);
                }

                this.api.ImgApply(props);
                this.toolbar.fireEvent('editcomplete', this.toolbar);
            },

            onClickMenuWrapping: function (menu, item, e) {
                var props = new Asc.asc_CImgProperty();
                props.put_WrappingStyle(item.options.wrapType);

                if ( _imgOriginalProps.get_WrappingStyle() === Asc.c_oAscWrapStyle2.Inline && item.options.wrapType !== Asc.c_oAscWrapStyle2.Inline ) {
                    props.put_PositionH(new Asc.CImagePositionH());
                    props.get_PositionH().put_UseAlign(false);
                    props.get_PositionH().put_RelativeFrom(Asc.c_oAscRelativeFromH.Column);

                    var val = _imgOriginalProps.get_Value_X(Asc.c_oAscRelativeFromH.Column);
                    props.get_PositionH().put_Value(val);

                    props.put_PositionV(new Asc.CImagePositionV());
                    props.get_PositionV().put_UseAlign(false);
                    props.get_PositionV().put_RelativeFrom(Asc.c_oAscRelativeFromV.Paragraph);

                    val = _imgOriginalProps.get_Value_Y(Asc.c_oAscRelativeFromV.Paragraph);
                    props.get_PositionV().put_Value(val);
                }

                this.api.ImgApply(props);
                this.toolbar.fireEvent('editcomplete', this.toolbar);
            },

            onClickMenuGroup: function (menu, item, e) {
                var props = new Asc.asc_CImgProperty();
                props.put_Group(item.options.groupval);

                this.api.ImgApply(props);
                this.toolbar.fireEvent('editcomplete', this.toolbar);
            },

            onClickMenuForward: function (menu, item, e) {
                var props = new Asc.asc_CImgProperty();

                if ( menu == 'forward' )
                    props.put_ChangeLevel(Asc.c_oAscChangeLevel.BringForward); else
                if ( menu == 'backward' )
                    props.put_ChangeLevel(Asc.c_oAscChangeLevel.BringBackward); else
                    props.put_ChangeLevel(item.options.valign);

                this.api.ImgApply(props);
                this.toolbar.fireEvent('editcomplete', this.toolbar);
            }
        }
    })());
});
