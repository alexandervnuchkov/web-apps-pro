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
 *    Viewport.js
 *
 *    Controller for the viewport
 *
 *    Created by Maxim Kadushkin on 24 March 2014
 *    Copyright (c) 2014 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'common/main/lib/view/Header',
    'spreadsheeteditor/main/app/view/Viewport'
//    ,'spreadsheeteditor/main/app/view/LeftMenu'
], function (Viewport) {
    'use strict';

    SSE.Controllers.Viewport = Backbone.Controller.extend({
        // Specifying a Viewport model
        models: [],

        // Specifying a collection of out Viewport
        collections: [],

        // Specifying application views
        views: [
            'Viewport',   // is main application layout
            'Common.Views.Header'
        ],

        // When controller is created let's setup view event listeners
        initialize: function() {
            var me = this;

            // This most important part when we will tell our controller what events should be handled
            this.addListeners({
                'Toolbar': {
                    'render:before' : function (toolbar) {
                        var config = SSE.getController('Main').appOptions;
                        toolbar.setExtra('right', me.header.getPanel('right', config));
                        toolbar.setExtra('left', me.header.getPanel('left', config));
                    },
                    'view:compact'  : function (toolbar, state) {
                        me.viewport.vlayout.panels[0].height = state ? 32 : 32+67;
                    }
                }
            });

            Common.NotificationCenter.on('app:face', this.onAppShowed.bind(this));
        },

        setApi: function(api) {
            this.api = api;
        },

        onAppShowed: function (config) {
            var me = this;

            if ( !config.isEdit ||
                    ( !Common.localStorage.itemExists("sse-compact-toolbar") &&
                        config.customization && config.customization.compactToolbar ))
            {
                me.viewport.vlayout.panels[0].height = 32;
            } else
            if ( config.isEditDiagram || config.isEditMailMerge ) {
                me.viewport.vlayout.panels[0].height = 41;
            }
        },

        // When our application is ready, lets get started
        onLaunch: function() {
            // Create and render main view
            this.viewport = this.createView('Viewport').render();
            this.header   = this.createView('Common.Views.Header', {
                headerCaption: 'Spreadsheet Editor',
                storeUsers: SSE.getCollection('Common.Collections.Users')
            });

            Common.NotificationCenter.on('layout:changed', _.bind(this.onLayoutChanged, this));
            $(window).on('resize', _.bind(this.onWindowResize, this));

            this.viewport.celayout.on('layout:resizedrag', function() {
                this.viewport.fireEvent('layout:resizedrag', [this, 'cell:edit']);
                this.api.asc_Resize();
            }, this);

            var leftPanel = $('#left-menu');
            this.viewport.hlayout.on('layout:resizedrag', function() {
                this.api.asc_Resize();
                Common.localStorage.setItem('sse-mainmenu-width',leftPanel.width());
            }, this);

            this.boxSdk = $('#editor_sdk');
            this.boxFormula = $('#cell-editing-box');
            this.boxSdk.css('border-left', 'none');
            this.boxFormula.css('border-left', 'none');
        },

        onLayoutChanged: function(area) {
            switch (area) {
            default:
                this.viewport.vlayout.doLayout();
                this.viewport.celayout.doLayout();
            case 'rightmenu':
                this.viewport.hlayout.doLayout();
                break;
            case 'leftmenu':
                var panel = this.viewport.hlayout.items[0];
                if (panel.resize.el) {
                    if (panel.el.width() > 40) {
                        this.boxSdk.css('border-left', '');
                        this.boxFormula.css('border-left', '');
                        panel.resize.el.show();
                    } else {
                        panel.resize.el.hide();
                        this.boxSdk.css('border-left', 'none');
                        this.boxFormula.css('border-left', 'none');
                    }
                }
                this.viewport.hlayout.doLayout();
                break;
            case 'header':
            case 'toolbar':
            case 'status':
                this.viewport.vlayout.doLayout();
                this.viewport.celayout.doLayout();
                break;
            case 'celleditor':
                if (arguments[1]) {
                    this.boxSdk.css('border-top', arguments[1]=='hidden'?'none':'');
                }
                this.viewport.celayout.doLayout();
                break;
            }
            this.api.asc_Resize();
        },

        onWindowResize: function(e) {
            this.onLayoutChanged('window');
            Common.NotificationCenter.trigger('window:resize');
        }
    });
});
