define(['connectionManager', 'imageLoader', 'loading', 'scroller', './focushandler', 'focusManager', 'scrollHelper', 'browser', './../skininfo', 'emby-button', 'scrollStyles'], function (connectionManager, imageLoader, loading, scroller, focusHandler, focusManager, scrollHelper, browser, skinInfo) {
    'use strict';

    var apiClient = connectionManager.currentApiClient();

    function focusViewSlider() {

        var selected = this.querySelector('.selected');

        if (selected) {
            focusManager.focus(selected);
        } else {
            focusManager.autoFocus(this);
        }
    }

    function createHeaderScroller(view, instance, initialTabId) {

        var userViewNames = view.querySelector('.userViewNames');

        userViewNames.classList.add('smoothScrollY');
        userViewNames.classList.add('focusable');
        userViewNames.classList.add('focuscontainer-y');
        userViewNames.style.scrollBehavior = 'smooth';
        userViewNames.focus = focusViewSlider;

        loading.hide();

        var initialTab = initialTabId ? userViewNames.querySelector('.btnUserViewHeader[data-id=\'' + initialTabId + '\']') : null;

        if (!initialTab) {
            initialTab = userViewNames.querySelector('.btnUserViewHeader');
        }

        // In Edge the web components aren't always immediately accessible
        setTimeout(function () {
            instance.setFocusDelay(view, initialTab);
        }, 0);
    }

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    function initEvents(view, instance) {
        var apiClient = connectionManager.currentApiClient();

        // Catch events on the view headers
        var userViewNames = view.querySelector('.userViewNames');
        userViewNames.addEventListener('click', function (e) {

            var elem = parentWithClass(e.target, 'btnUserViewHeader');

            if (elem) {
                scrollHelper.toCenter(userViewNames, elem, true);
                instance.setFocusDelay(view, elem);
            }
        });

        userViewNames.addEventListener('focus', function (e) {

            var elem = parentWithClass(e.target, 'btnUserViewHeader');

            if (elem) {
                scrollHelper.toCenter(userViewNames, elem, true);
                instance.setFocusDelay(view, elem);
            }
        }, true);

        userViewNames.addEventListener('click', function (e) {
            var elem = parentWithClass(e.target, 'btnUserViewHeader');
            if (elem) {
                var viewId = elem.getAttribute('data-id');
                var viewType = elem.getAttribute('data-type');
                //console.log("viewType:" + viewType);
                switch(viewType) {
                	case 'movies':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'movies/movies.html?parentid=' + viewId));
                	    break;
                	case 'tvshows':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'tv/tv.html?parentid=' + viewId + '&serverId=' + apiClient.serverId()));
                	    break;
                	case 'music':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'music/music.html?tab=albumartists&parentid=' + viewId));
                	    break;
                	case 'homevideos':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'list/list.html?parentid=' + viewId));
                	    break;
                	case 'folders':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'list/list.html?parentid=' + viewId));
                	    break;
                	default:
                		Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'list/list.html?parentid=' + viewId));
                }
            }
        }, true);
    }

    function parentWithClass(elem, className) {
        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;
            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    function selectUserView(page, id, self) {

        var btn = page.querySelector(".btnUserViewHeader[data-id='" + id + "']");

        // self.bodyScroller.slideTo(0, true);

        var contentScrollSlider = page.querySelector('.viewContentArea');
        contentScrollSlider.innerHTML = '';
        var promise = self.loadViewContent.call(self, page, id, btn.getAttribute('data-type'));

        // Only enable the fade if native WebAnimations are supported
        if (promise && browser.animate) {
            promise.then(function () {
                fadeInRight(contentScrollSlider);

                page.addEventListener('click', function (e) {
                  var elem = parentWithClass(e.target, 'itemAction');
                  if (elem) {
                    var viewId = elem.getAttribute('data-id');
              	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'item/item.html?id=' + viewId + '&serverId=' + apiClient.serverId()));
                  }
                });
            });
        }
    }

    function libraryItemFocus(e) {
        var oldSelectedItem = document.querySelector('.selectedItemId')
        var oldSelectedItemId = '';
        if(oldSelectedItem) {
            oldSelectedItemId = oldSelectedItem.getAttribute('data-selected-id');
        }

        // Build Item Info Pane
        var itemInfoElement = document.querySelector('.itemInfo');
        var selectedIndexElement = document.querySelector('.selectedIndex');
        var focused = focusManager.focusableParent(e.target);

        var itemId = focused.getAttribute('data-id');

        if(itemId === oldSelectedItemId) return;

        Emby.Models.item(itemId).then(function (item) {
            console.log('itemResult', item);

            var imageUrlPrimary = apiClient.getImageUrl(item.Id, {
                type: "Primary",
                maxHeight: 400,
                maxWidth: 300,
                tag: item.ImageTags.Primary
            });

            var imageUrlBackdrop = apiClient.getImageUrl(item.Id, {
                type: "Backdrop",
                maxHeight: 1920,
                maxWidth: 1080,
                tag: item.BackDropImageTags
            });

            var html = '';
            html += '<div class="selectedItemId hide" data-selected-id="' + itemId + '"></div>'
            html += '<div class="primary lazy" data-src="' + imageUrlPrimary + '"></div>';
            html += '<div class="backdrop lazy" data-src="' + imageUrlBackdrop + '"></div>';

            html += '<div class="textInfo">';
            html += '<h1 class="name">' + item.Name + '</h1>';

            if(item.ProductionYear){
                html += '<h1 class="year">' + item.ProductionYear + '</h1>';
            }
            if(item.Genres.length > 0){
                html += '<h2 class="genres">' + item.Genres.join(' / ') + '</h2>';
            }

            if(item.Overview){
                html += '<p class="overview">' + item.Overview + '</p>';
            }
            html += '</div>';
            if(item.CommunityRating) {
                html += '<div class="communityRating"><span class="rating">' + item.CommunityRating + '</span><span divider>/</span>10</div>';
            }

            if(item.RunTimeTicks)
            {
                var runTime = Math.ceil((item.RunTimeTicks / 10000) / 60000);
                html += '<div class="runTime">' + runTime + ' minutes</div>';
            }

            // var videoStream = (item.MediaStreams || []).filter(function (i) {
            //     return i.Type == 'Video';
            // })[0] || {};
            // var audioStream = (item.MediaStreams || []).filter(function (i) {
            //     return i.Type == 'Audio';
            // })[0] || {};
            //
            // console.log('videoStream', videoStream);
            // console.log('audioStream', audioStream);
            //
            // if(videoStream) {
            //     html += '';
            // }

            if(item.MediaSources && item.MediaSources.length > 0) {
              html += '<div class="mediaInfoPrimary">';
              var mediaSource = item.MediaSources[0];

              var videoStream = (mediaSource.MediaStreams || []).filter(function (i) {
                  return i.Type == 'Video';
              })[0] || {};
              var audioStream = (mediaSource.MediaStreams || []).filter(function (i) {
                  return i.Type == 'Audio';
              })[0] || {};

              var resolutionText = getResolutionText(item);
              if (resolutionText) {
                  html += '<div class="mediaInfoIcon mediaInfoText">' + resolutionText + '</div>';
              }

              var channels = getChannels(item);
              var channelText;

              if (channels == 8) {

                  channelText = '7.1';

              } else if (channels == 7) {

                  channelText = '6.1';

              } else if (channels == 6) {

                  channelText = '5.1';

              } else if (channels == 2) {

                  channelText = '2.0';
              }

              if (channelText) {
                  html += '<div class="mediaInfoIcon mediaInfoText">' + channelText + '</div>';
              }

              html += '</div>';

              html += '<div class="mediaInfo">';

              if (mediaSource.Container) {
                  html += '<div class="mediaInfoIcon mediaInfoText">' + mediaSource.Container + '</div>';
              }

              if (videoStream.Codec) {
                  html += '<div class="mediaInfoIcon mediaInfoText">' + videoStream.Codec + '</div>';
              }

              if (audioStream.Codec == 'dca' && audioStream.Profile) {
                  html += '<div class="mediaInfoIcon mediaInfoText">' + audioStream.Profile + '</div>';
              } else if (audioStream.Codec) {
                  html += '<div class="mediaInfoIcon mediaInfoText">' + audioStream.Codec + '</div>';
              }

              if (videoStream.AspectRatio) {
                  html += '<div class="mediaInfoIcon mediaInfoText">' + videoStream.AspectRatio + '</div>';
              }

              html += '</div>';
            }

            itemInfoElement.innerHTML = html;

            imageLoader.lazyChildren(itemInfoElement);


            var index = focused.getAttribute('data-index');
            if (index) {
                selectedIndexElement.innerHTML = 1 + parseInt(index);
            }

            var overviewElement = itemInfoElement.querySelector('.overview');

            var overviewHeight = overviewElement.scrollHeight;
            console.log('overviewElement.clientHeight', overviewElement.clientHeight);
            console.log('overviewElement.scrollHeight', overviewElement.scrollHeight);

            var scrollTime = 5000;

            //initOverviewScroll(overviewElement, overviewHeight, scrollTime);

            setTimeout(function () {
                scrollOverview(overviewElement);
            }, 3000);


            // // Selected Menu
            // var selectedMenu = document.querySelector('.selectedMenu');
            //
            // var html = '';
            // if(item.UserData.PlaybackPositionTicks > 0)
            // {
            //     // Convert ticks to hours and minutes
            //     var positionTime = Math.ceil((item.UserData.PlaybackPositionTicks / 10000) / 60000);
            //
            //     html += '<button class="playbackResume" data-item-id="' + itemId + '">Resume from ' + positionTime + ' minutes</button>';
            // }
            //
            // html += '<button class="playbackPlay" data-item-id="' + itemId + '">Play</button>';
            //
            // html += '<button class="moreInfo" data-item-id="' + itemId + '">More info</button>';
            //
            // if(item.LocalTrailerCount > 0)
            // {
            //     html += '<button class="playbackTrailer" data-item-id="' + itemId + '">Trailer</button>';
            // }
            //
            // html += '<button>Mark as watched</button>';
            //
            // selectedMenu.innerHTML = html;
            //
            // bindSelectedMenuEvents(selectedMenu);
        });
    }

    function scrollOverview(overviewElement)
      {
          var currentPosition = overviewElement.scrollTop;
          var elementScrollHeight = overviewElement.scrollHeight;
          var elementClientHeight = overviewElement.clientHeight;

          if(currentPosition >= (elementScrollHeight - elementClientHeight) - 1) {
              setTimeout(function() {
                  overviewElement.scrollTop = 0;
                  setTimeout(function () {
                      scrollOverview(overviewElement);
                  }, 3000);
              }, 4000);
              return;
          }

          overviewElement.scrollTop += 1;

          setTimeout(function() {
              scrollOverview(overviewElement);
          }, 75);
      }

    function getResolutionText(item) {

        if (!item.MediaSources || !item.MediaSources.length) {
            return null;
        }

        return item.MediaSources[0].MediaStreams.filter(function (i) {

            return i.Type == 'Video';

        }).map(function (i) {

            if (i.Height) {

                if (i.Width >= 4000) {
                    return '4K';
                }
                if (i.Width >= 2500) {
                    return '1440P';
                }
                if (i.Width >= 1900) {
                    return '1080P';
                }
                if (i.Width >= 1260) {
                    return '720P';
                }
                if (i.Width >= 700) {
                    return '480P';
                }

            }
            return null;
        })[0];

    }

    function getChannels(item) {

        if (!item.MediaSources || !item.MediaSources.length) {
            return 0;
        }

        return item.MediaSources[0].MediaStreams.filter(function (i) {

            return i.Type == 'Audio';

        }).map(function (i) {
            return i.Channels;
        })[0];

    }

    function fadeInRight(elem) {

        var keyframes = [
          { opacity: '0', transform: 'translate3d(1%, 0, 0)', offset: 0 },
          { opacity: '1', transform: 'none', offset: 1 }];
        var timing = { duration: 300, iterations: 1 };
        elem.animate(keyframes, timing);
    }

    function tabbedPageVertical(page, pageOptions) {

        var self = this;
        pageOptions = pageOptions || {};

        console.log('pageOptions', pageOptions);

        // lock the height so that the location of the top tabs won't fluctuate
        var contentScrollSlider = page.querySelector('.viewContentArea');
        contentScrollSlider.classList.add('focuscontainer-y');

        var selectedItemInfoElement = page.querySelector('.selectedItemInfo');
        var selectedIndexElement = page.querySelector('.selectedIndex');

        var tagName = 'button';

        var icons = {};
        icons.default = '&#xE037;';
        icons.movies = '&#xE02C;';
        icons.tvshows = '&#xE333;';
        icons.livetv = '&#xE639;';
        icons.homevideos = '&#xE3AF;';
        icons.music = '&#xE32D;';
        icons.photos = '&#xE412;';

        self.renderTabs = function (tabs, initialTabId) {

            page.querySelector('.userViewNames').innerHTML = tabs.map(function (i) {

                return '<' + tagName + ' is="emby-button" class="flat btnUserViewHeader button-flat violet" data-id="' + i.Id + '" data-type="' + (i.CollectionType || '') + '"><h3 class="userViewButtonText"><i class="md-icon">' + icons[i.CollectionType || 'default'] + '</i>' + i.Name + '</h3></' + tagName + '>';

            }).join('');

            createHeaderScroller(page, self, initialTabId);
            createVerticalScroller(page);
            console.log('page', page);
            initEvents(page, self);
        };

        function onAlphaPickerValueChanged() {

            var value = pageOptions.alphaPicker.value();

            trySelectValue(value);
        }

        function trySelectValue(value) {

            var card;

            // If it's the symbol just pick the first card
            if (value === '#') {

                card = contentScrollSlider.querySelector('.card');

                if (card) {
                    self.bodyScroller.toCenter(card, false);
                    return;
                }
            }

            card = contentScrollSlider.querySelector('.card[data-prefix^=\'' + value + '\']');

            if (card) {
                self.bodyScroller.toCenter(card, false);
                return;
            }

            // go to the previous letter
            var values = pageOptions.alphaPicker.values();
            var index = values.indexOf(value);

            if (index < values.length - 2) {
                trySelectValue(values[index + 1]);
            } else {
                var all = contentScrollSlider.querySelectorAll('.card');
                card = all.length ? all[all.length - 1] : null;

                if (card) {
                    self.bodyScroller.toCenter(card, false);
                }
            }
        }

        if (pageOptions.alphaPicker) {
            pageOptions.alphaPicker.on('alphavaluechanged', onAlphaPickerValueChanged);
        }

        var focusTimeout;
        var focusDelay = 0;
        self.setFocusDelay = function (view, elem, immediate) {

            var viewId = elem.getAttribute('data-id');

            var btn = view.querySelector('.btnUserViewHeader.selected');

            if (btn) {

                if (viewId === btn.getAttribute('data-id')) {
                    return;
                }
            }

            if (elem !== btn) {
                if (btn) {
                    btn.classList.remove('selected');
                }
                elem.classList.add('selected');
            }

            if (focusTimeout) {
                clearTimeout(focusTimeout);
            }

            var onTimeout = function () {

                selectUserView(view, viewId, self);

            };

            if (immediate) {
                onTimeout();
            } else {
                focusTimeout = setTimeout(onTimeout, focusDelay);
            }

            // No delay the first time
            focusDelay = 700;
        };

        function createVerticalScroller(view) {

            var scrollFrame = view.querySelector('.itemScrollFrame');

            var options = {
                horizontal: 0,
                itemNav: 0,
                mouseDragging: 1,
                touchDragging: 1,
                slidee: view.querySelector('.contentScrollSlider'),
                itemSelector: '.card',
                smart: true,
                releaseSwing: true,
                scrollBy: 200,
                speed: 300,
                immediateSpeed: pageOptions.immediateSpeed,
                elasticBounds: 1,
                dragHandle: 1,
                dynamicHandle: 1,
                clickBar: 1,
                scrollWidth: 500000
            };

            self.bodyScroller = new scroller(scrollFrame, options);
            self.bodyScroller.init();
            initFocusHandler(view, self.bodyScroller);
        }

        function initFocusHandler(view) {

            if (pageOptions.handleFocus) {

                var scrollSlider = view.querySelector('.contentScrollSlider');

                self.focusHandler = new focusHandler({
                    parent: scrollSlider,
                    selectedItemInfoElement: selectedItemInfoElement,
                    selectedIndexElement: selectedIndexElement,
                    animateFocus: pageOptions.animateFocus,
                    scroller: self.bodyScroller,
                    enableBackdrops: true
                });
            }

            view.addEventListener('focus', libraryItemFocus, true);
        }

        self.destroy = function () {

            if (pageOptions.alphaPicker) {
                pageOptions.alphaPicker.off('alphavaluechanged', onAlphaPickerValueChanged);
            }

            if (self.focusHandler) {
                self.focusHandler.destroy();
                self.focusHandler = null;
            }
            if (self.bodyScroller) {
                self.bodyScroller.destroy();
                self.bodyScroller = null;
            }
        };
    }

    return tabbedPageVertical;
});
