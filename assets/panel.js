var localStorage
// The "Block sites from setting any data" option prevents the extension
// from accessing the localStorage. Any attempt to access window.localStorage
// will raise a security exception.
try {
  localStorage = window.localStorage
} catch (e) {
  localStorage = {}
}


function StartupService(data)
{
  var output = ''

  if (! data.hasOwnProperty('responseData')
    || ! data.responseData.hasOwnProperty('socialbar_list')
  ) {
    return
  }

  console.log(data.responseData.socialbar_list)
  data.responseData.socialbar_list.map(function(friend) {
    output += (friend.rank + ' ' + friend.name + '<br/>')
  })

  return output
}


function OtherPlayerService(data)
{
  var interactions = {}
    , output = 'here'

console.log(data)

/*
  data.responseData[0].filter(function(interaction) {
    return interaction.hasOwnProperty('other_player')
  }).map(function(interaction) {
    var eventType = interaction.type
      , action = 1

    if (! interactions.hasOwnProperty(interaction.other_player.name)) {
      interactions[interaction.other_player.name] = {}
    }

    switch (interaction.type) {
      case 'friend_accepted':
        eventType = 'social_interaction'
        interactions[interaction.other_player.name].isNewFriend = true
        action = 0
        break

      case 'polivate_failed':
        eventType = 'social_interaction'
        break

      case 'social_interaction':
      case 'friend_tavern_sat_down':
      case 'trade_accepted':
        break

      case 'battle':
        break

      default:
        return
    }

    if (! interactions[interaction.other_player.name].hasOwnProperty(eventType)) {
      interactions[interaction.other_player.name][eventType] = 0
    }

    interactions[interaction.other_player.name][eventType] += action
    interactions[interaction.other_player.name].name = interaction.other_player.name
    interactions[interaction.other_player.name].isFriend = interaction.other_player.is_friend
    interactions[interaction.other_player.name].isNeighbor = interaction.other_player.is_neighbor
    interactions[interaction.other_player.name].isGuildMember = interaction.other_player.is_guild_member
  })

  interactions = Object.values(interactions)

  var friends = interactions.filter(function(interaction) {
        return interaction.isFriend
      })
    , neighbors = interactions.filter(function(interaction) {
        return interaction.isNeighbor && interaction.isGuildMember === false && interaction.isFriend === false
      })
    , guildies = interactions.filter(function(interaction) {
        return interaction.isGuildMember && interaction.isFriend === false
      })
    , output = `<ul data-role="tabs"><li class="active" data-name="friends">Friends</li><li data-name="guildies">Guildies</li><li data-name="neighbors">Neighbours</li></ul>
        <ul data-role="content">
          <li class="active" data-name="friends">${playerInteractionsTable(friends)}</li>
          <li data-name="guildies">${playerInteractionsTable(guildies)}</li>
          <li data-name="neighbors">${playerInteractionsTable(neighbors)}</li>
        </ul>`
*/
  return output
}


function playerInteractionsTable(interactions)
{
  interactions.sort(function(a, b) {
    var nameA = a.name.toUpperCase()
      , nameB = b.name.toUpperCase()

    if (nameA < nameB) {
      return -1
    }
    if (nameA > nameB) {
      return 1
    }

    return 0
  })

  var output = `<table>
      <tr>
        <th>Player</th>
        <th title="Trades">G</th>
        <th title="Aids">A</th>
        <th title="Tavern visits">T</th>
        <th></th>
      <tr>`

  interactions.map(function(player) {
    var decoration = ''
      , id = `player-${selector(player.name)}`

    if (isNaN(player.social_interaction)
      || player.social_interaction < 3
      || isNaN(player.friend_tavern_sat_down)
      || player.friend_tavern_sat_down < 3
    ) {
      decoration = ' class="mark-of-shame"'
    }

    if (player.hasOwnProperty('isNewFriend')) {
      decoration = ' class="mark-of-fame"'
    }

    output += `
      <tr${decoration}>
        <td><input id="${id}" type="checkbox"><label for="${id}">${player.name}</label></td>
        <td class="integer">${player.trade_accepted || ''}</td>
        <td class="integer">${player.social_interaction || ''}</td>
        <td class="integer">${player.friend_tavern_sat_down || ''}</td>
        <td class="diagram"><figure><div style="width:${player.social_interaction * 1.5 || 0}em"></div><div style="width:${player.friend_tavern_sat_down * 1.5 || 0}em"></div></figure></td>
      </tr>`
  })

  output += `</table><p>Total of ${Object.keys(interactions).length} interactions</p>`

  return output
}


function selector(string)
{
  return string.toLowerCase().replace(/\W/g, '-')
}


function item(value, content, append)
{
  var id = 'section-' + selector(value)
      dl = document.querySelector('dl')
    , dt = document.createElement('dt')
    , dd = document.createElement('dd')
    , has = Array.from(document.querySelectorAll('.' + id))

  if (has.length === 0) {
    append = true
  } else {
    dt = has[0]
    dd = has[1]
  }

  dt.textContent = value
  dd.innerHTML = content

  if (append) {
    dt.classList.add(id)
    dd.classList.add(id)
    dl.appendChild(dt)
    dl.appendChild(dd)
  }
}

function clicky()
{
  Array.from(document.querySelectorAll('input[type=checkbox]')).map(function(item) {
    item.addEventListener('change', function(event) {

      event.target.parentNode.parentNode.classList.toggle('checked', event.target.checked)
    }, false)
  })
}

function tabby()
{
  var tabsList = Array.from(document.querySelectorAll('[data-role=tabs] li'))
    , tabsContentList = Array.from(document.querySelectorAll('[data-role=content] li'))
    , switcher = function switcher(items, current) {
        items.filter(function(item) {
          if (item.getAttribute('data-name') !== current) {
            return true
          }

          item.classList.add('active')
          return false
        }).map(function(item) {
          item.classList.remove('active')
        })
      }

  tabsList.map(function(item) {
    item.addEventListener('click', function tabClick(event) {
      switcher(tabsList, event.target.getAttribute('data-name'))
      switcher(tabsContentList, event.target.getAttribute('data-name'))
    }, false)
  })
}

function body(payload) {
  var sectionName = ''
    , needed = payload.filter(function(item) {
        var tabId = 0
          , branch = ''
        if (! item.hasOwnProperty('requestClass')) {
          return false
        }

        switch (item.requestClass) {
            case 'OtherPlayerService':
              switch (item.requestMethod) {
                case 'getEventsPaginated': // event history
                  app.setEventsData(item.responseData)
                  break

                case 'getFriendsList':
                  branch = app.BRANCH_FRIENDS
                  app.setData(item.responseData, branch)
                  break

                case 'getClanMemberList':
                  branch = app.BRANCH_GUILDIES
                  app.setData(item.responseData, branch)
                  break

                case 'getNeighborList':
                  branch = app.BRANCH_NEIGHBORS
                  app.setData(item.responseData, branch)
                  break
              }
              break

            case 'StartupService':
              switch (item.requestMethod) {
                case 'getData':
                  tabId = item.responseData.settings.socialBarTab || 0
                  switch (tabId) {
                    case 0: // friends
                      branch = app.BRANCH_FRIENDS
                      app.setData(item.responseData.socialbar_list, branch)
                      break

                    case 1: // guildies
                      branch = app.BRANCH_GUILDIES
                      app.setData(item.responseData.socialbar_list, branch)
                      break

                    case 2: // neighbors
                      branch = app.BRANCH_NEIGHBORS
                      app.setData(item.responseData.socialbar_list, branch)
                      break
                  }
                  break
              }
              break

            case 'TimeService':
            case 'QuestService':
              return false
        }

        return true
      })
/*
  needed.map(function(json) {
    if (typeof window[json.requestClass] === 'function') {
      item(sectionName, window[json.requestClass](json))
      clicky()
      tabby()
    } else {
      // item('Not implemented', json.requestClass)
    }
  })
*/
  // print in the site's console for inspection
  // cl(needed)
}

chrome.devtools.network.onRequestFinished.addListener(function(entry) {
  var parser = document.createElement('a')
  parser.href = entry.request.url

  if (! /forgeofempires\.com/g.test(parser.hostname)) {
    return
  }

  var isJsonRequest = entry.response.headers.filter(function(header) {
    return header.name === 'Content-Type' && header.value.match(/application\/json/i)
  })

  if (isJsonRequest.length <= 0) {
    return
  }

  entry.getContent(function(payload) {
    try {
      payload = JSON.parse(payload)
    } catch (e) {}

    body(payload)
  })
})