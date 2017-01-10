define(['./spotlight', 'scroller', 'imageLoader', 'focusManager', 'cardBuilder', './../components/tile', './../skininfo', 'emby-itemscontainer'], function (spotlight, scroller, imageLoader, focusManager, cardbuilder, tile, skinInfo) {
    'use strict';

    function loadResume(element, parentId) {

        var options = {

            Limit: 6,
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return Emby.Models.resumable(options).then(function (result) {

            var section = element.querySelector('.resumeSection');

            cardbuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'portrait',
                rows: 1,
                scalable: false
            });
        });
    }

    function loadLatest(element, parentId) {

        var options = {

            IncludeItemTypes: "Movie",
            Limit: 30,
            ParentId: parentId,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return Emby.Models.latestItems(options).then(function (result) {

            var section = element.querySelector('.latestSection');

            cardbuilder.buildCards(result, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'portrait',
                rows: 1,
                scalable: false
            });
        });
    }

    function loadSpotlight(instance, element, parentId) {

        var options = {

            SortBy: "Random",
            IncludeItemTypes: "Movie",
            Limit: 20,
            Recursive: true,
            ParentId: parentId,
            EnableImageTypes: "Backdrop",
            ImageTypes: "Backdrop",
            Fields: "Taglines"
        };

        return Emby.Models.items(options).then(function (result) {

            var card = element.querySelector('.wideSpotlightCard');

            instance.spotlight = new spotlight(card, result.Items, 767);
        });
    }

    function loadRecommendations(element, apiClient, parentId) {

        return apiClient.getMovieRecommendations({

            categoryLimit: 4,
            ItemLimit: 8,
            UserId: apiClient.getCurrentUserId(),
            ImageTypeLimit: 1,
            Fields: "PrimaryImageAspectRatio"

        }).then(function (recommendations) {

            var values = recommendations.map(getRecommendationHtml);

            var recs = element.querySelector('.recommendations');

            if (recs) {
                recs.innerHTML = values.join('');

                imageLoader.lazyChildren(recs);
            }
        });
    }

    function getRecommendationHtml(recommendation) {

        var cardsHtml = cardbuilder.getCardsHtml(recommendation.Items, {
            shape: 'portrait',
            rows: 2,
            scalable: false
        });

        var html = '';

        var title = '';

        switch (recommendation.RecommendationType) {

            case 'SimilarToRecentlyPlayed':
                title = Globalize.translate('RecommendationBecauseYouWatched').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'SimilarToLikedItem':
                title = Globalize.translate('RecommendationBecauseYouLike').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'HasDirectorFromRecentlyPlayed':
            case 'HasLikedDirector':
                title = Globalize.translate('RecommendationDirectedBy').replace("{0}", recommendation.BaselineItemName);
                break;
            case 'HasActorFromRecentlyPlayed':
            case 'HasLikedActor':
                title = Globalize.translate('RecommendationStarring').replace("{0}", recommendation.BaselineItemName);
                break;
        }

        html += '<div class="horizontalSection">';
        html += '<div class="sectionTitle">' + title + '</div>';

        html += '<div is="emby-itemscontainer" class="itemsContainer">';

        html += cardsHtml;

        html += '</div>';
        html += '</div>';

        return html;
    }

    function loadImages(element, parentId) {

        return Emby.Models.items({

            SortBy: "IsFavoriteOrLiked,Random",
            IncludeItemTypes: "Movie",
            Limit: 2,
            Recursive: true,
            ParentId: parentId,
            EnableImageTypes: "Backdrop",
            ImageTypes: "Backdrop"

        }).then(function (result) {

            var items = result.Items;
            var imgOptions = {
                maxWidth: 600
            };

            if (items.length > 0) {
                //element.querySelector('.movieFavoritesCard .cardImage').style.backgroundImage = "url('" + Emby.Models.backdropImageUrl(items[0], imgOptions) + "')";
            }

            if (items.length > 1) {
                //element.querySelector('.allMoviesCard .cardImage').style.backgroundImage = "url('" + Emby.Models.backdropImageUrl(items[1], imgOptions) + "')";
            }
        });
    }

    function initialiseScrollers() {
      var scrollFrame = document.querySelector('.tilesSection');

      var options = {
        horizontal: 1,
        itemNav: 0,
        mouseDragging: 1,
        touchDragging: 1,
        slidee: document.querySelector('.tilesContainer'),
        itemSelector: '.tile',
        smart: true,
        releaseSwing: true,
        scrollBy: 200,
        speed: 300,
        immediateSpeed: 1,
        elasticBounds: 1,
        dragHandle: 1,
        dynamicHandle: 1,
        clickBar: 1,
        scrollWidth: 500000
      };

      self.tilesScroller = new scroller(scrollFrame, options);
      self.tilesScroller.init();
      //initFocusHandler(view, self.bodyScroller);
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

    function view(element, apiClient, parentId, autoFocus) {

        var self = this;

        if (autoFocus) {
            focusManager.autoFocus(element);
        }

        self.loadData = function (isRefresh) {

            var tileOptions = {
              target: ".tilesContainer",
              items: [
                {
                  title: Globalize.translate('Genres'),
                  link: 'movies/movies.html?tab=genres&parentid=' + parentId
                },
                {
                  title: Globalize.translate('Years'),
                  link: 'movies/movies.html?tab=years&parentid=' + parentId
                },
                {
                  title: Globalize.translate('Unwatched'),
                  link: 'movies/movies.html?tab=unwatched&parentid=' + parentId
                },
                {
                  title: Globalize.translate('Collections'),
                  link: 'movies/movies.html?tab=collections&parentid=' + parentId
                },
                {
                  title: Globalize.translate('TopRated'),
                  link: 'movies/movies.html?tab=toprated&parentid=' + parentId
                },
                {
                  title: Globalize.translate('Favorites'),
                  link: 'movies/movies.html?tab=favorites&parentid=' + parentId
                },
                {
                  title: Globalize.translate('Genres'),
                  link: 'movies/movies.html?tab=genres&parentid=' + parentId
                },
                {
                  title: Globalize.translate('Years'),
                  link: 'movies/movies.html?tab=years&parentid=' + parentId
                },
                {
                  title: Globalize.translate('Unwatched'),
                  link: 'movies/movies.html?tab=unwatched&parentid=' + parentId
                },
                {
                  title: Globalize.translate('Collections'),
                  link: 'movies/movies.html?tab=collections&parentid=' + parentId
                },
                {
                  title: Globalize.translate('TopRated'),
                  link: 'movies/movies.html?tab=toprated&parentid=' + parentId
                },
                {
                  title: Globalize.translate('Favorites'),
                  link: 'movies/movies.html?tab=favorites&parentid=' + parentId
                }
              ]
            };

            tile(tileOptions);

            var tileElems = document.querySelectorAll('.tile');

            for(var tileEl of tileElems) {
              tileEl.addEventListener('click', function (e) {
                var el = parentWithClass(e.target, 'tile');
                Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, el.getAttribute('data-link')));
              });
            }

            // element.querySelectorAll('.tile').addEventListener('click', function (e) {
            //   console.log('tile clicked, e', e);
            //   //Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'movies/movies.html?parentid=' + parentId));
            // });

            var promises = [
                loadResume(element, parentId),
                loadLatest(element, parentId)
            ];

            if (!isRefresh) {
                promises.push(loadRecommendations(element, apiClient, parentId));
            }

            return Promise.all(promises);
        };
        loadSpotlight(self, element, parentId);
        loadImages(element, parentId);


        initialiseScrollers();

        // element.querySelector('.allMoviesCard').addEventListener('click', function () {
        //     Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'movies/movies.html?parentid=' + parentId));
        // });
        //
        // element.querySelector('.movieCollectionsCard').addEventListener('click', function () {
        //     Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'movies/movies.html?tab=collections&parentid=' + parentId));
        // });
        //
        // element.querySelector('.movieFavoritesCard').addEventListener('click', function () {
        //     Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'movies/movies.html?tab=favorites&parentid=' + parentId));
        // });

        self.destroy = function () {
            if (self.spotlight) {
                self.spotlight.destroy();
                self.spotlight = null;
            }
        };
    }

    return view;

});
