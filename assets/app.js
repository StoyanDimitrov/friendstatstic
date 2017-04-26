Vue.component('socialbar', {
  props: [
    'players',
    'interactions',
  ],
  data: function() {
    return {
      tabs: {
        current: 'friends',
        list: {
          'friends': 'Friends',
          'guildies': 'Guildies',
          'neighbors': 'Neighbours',
        }
      }
    }
  },
  render (h) {
    let list = 'No info'
    const tabsContent = (Object.keys(this.$data.tabs.list).reduce((tabs, tab) => {
            tabs.push(h('li', {'class': {active: this.$data.tabs.current === tab}, on: {click: () => this.$data.tabs.current = tab}}, this.$data.tabs.list[tab]))

            return tabs
          }, []))
    const tabs = h('ul', {'class': 'tabs'}, tabsContent)

    if (this.players[this.$data.tabs.current].length > 0) {
      const rows = this.players[this.$data.tabs.current].reduce((trs, f) => {
        let i = {
              aids: [],
              tavernVisits: [],
              trades: [],
              battles: [],
              plunders: [],
            }

        if (this.$data.tabs.current !== 'friends' && f.isFriend === true) {
          return trs
        }

        if (this.interactions.hasOwnProperty(f.name)) {
          i = this.interactions[f.name]
        }

        trs.push(
          h('tr', {
              'class': {
                'mark-of-low-activity': ((i.aids.length + i.tavernVisits.length) < 4) && ! f.isSelf,
                'mark-of-new-friend': f.isNewFriend,
                'mark-of-inactivity': ! f.isActive && ! f.isSelf,
                'mark-of-self': f.isSelf,
              }
            }, [
            h('td', {'class': 'integer'}, '|'),
            h('td', {'class': 'integer'}, f.rank),
            h('td', f.name),
            h('td', {'class': 'integer'}, i.aids.length),
            h('td', {'class': 'integer'}, i.tavernVisits.length),
            h('td', {'class': 'integer'}, i.trades.length),
            h('td', {'class': 'integer'}, i.battles.length),
            h('td', {'class': 'integer'}, i.plunders.length),
          ])
        )

        return trs
      }, [
        h('tr', [
          h('th', {attrs: {'colspan': 2}}, 'Rank'),
          h('th', 'Name'),
          h('th', 'Aids'),
          h('th', 'Taverns'),
          h('th', 'Trades'),
          h('th', 'Battles'),
          h('th', 'Plundered'),
        ])
      ])

      list = [
        h('table', rows)
      ]
    }

    return h('dl', [
      h('dt', 'Socialbar'),
      h('dd', [tabs, list]),
    ])
  },
})



const app = new Vue({
  el: '#dl',
  data: {
    BRANCH_FRIENDS: 'friends',
    BRANCH_GUILDIES: 'guildies',
    BRANCH_NEIGHBORS: 'neighbors',
    players: {
      friends: [],
      guildies: [],
      neighbors: [],
    },
    events: {
      allPages: 0,
    },
    interactions: {},
  },
  render (createElement) {
    return createElement('socialbar', {
      props: {
        players: this.$data.players,
        interactions: this.$data.interactions,
      }
    })
  },
  methods: {
    setData: function setData(data, branch) {
// console.log(data, branch)

      this.$data.players[branch] = data.reduce((players, player) => {
        players.push({
          id: player.player_id,
          name: player.name,
          rank: player.rank,
          isActive: !! player.is_active,
          isSelf: player.is_self,
          isFriend: player.is_friend,
          isGuildie: player.is_guild_member,
          isNeighbor: player.is_neighbor,
          isOnline: !! player.is_online,
          isNewFriend: false,
        })

        return players
      }, [])
    },
    setEventsData: function setEventsData(data) {
      const acceptableEvents = [
        // 'ClanChangedDescriptionEvent'
        // 'ClanMemberNewEraEvent'
        // 'AchievementObtainedEvent'
        // 'GreatBuildingContributionEvent'
        // 'FriendshipEndedEvent'
        'BattleEvent',
        'FriendTavernSatDownEvent',
        'SocialInteractionEvent',
        'TradeAcceptedEvent',
      ]
// console.log(data)
      switch (data.page) {
        case 1:
          this.$data.events.allPages = Math.ceil(data.totalEvents / data.amountPerPage)
          // break ommited

        default:
          data.events.filter(function(i) {
            return acceptableEvents.indexOf(i.__class__) !== -1
          }).map(function(i) {
            if (! this.$data.interactions.hasOwnProperty(i.other_player.name)) {
              this.$set(this.$data.interactions, i.other_player.name, {
                aids: [],
                tavernVisits: [],
                trades: [],
                battles: [],
                plunders: [],
              })
            }
// console.log(i.type, i)

            switch (i.type) {
              case 'friend_accepted':
                this.$data.friends[i.other_player.name].isNewFriend = true
                break

              case 'polivate_failed':
              case 'social_interaction':
                switch (i.interaction_type) {
                  case 'motivate':
                  case 'polish':
                    this.$data.interactions[i.other_player.name].aids.push(i.id)
                    this.$data.interactions[i.other_player.name].aids = [...new Set(this.$data.interactions[i.other_player.name].aids)]
                    break

                  case 'plunder':
                    this.$data.interactions[i.other_player.name].plunders.push(i.id)
                    this.$data.interactions[i.other_player.name].plunders = [...new Set(this.$data.interactions[i.other_player.name].plunders)]
                    break
                }
                break

              case 'friend_tavern_sat_down':
                this.$data.interactions[i.other_player.name].tavernVisits.push(i.id)
                this.$data.interactions[i.other_player.name].tavernVisits = [...new Set(this.$data.interactions[i.other_player.name].tavernVisits)]
                break

              case 'trade_accepted':
                this.$data.interactions[i.other_player.name].trades.push(i.id)
                this.$data.interactions[i.other_player.name].trades = [...new Set(this.$data.interactions[i.other_player.name].trades)]
                break

              case 'battle':
                this.$data.interactions[i.other_player.name].battles.push(i.id)
                this.$data.interactions[i.other_player.name].battles = [...new Set(this.$data.interactions[i.other_player.name].battles)]
                break

              default:
                return
            }
          }, this)
          break
      }
// console.log('setEventData', this.$data.interactions)
    },
  },
})