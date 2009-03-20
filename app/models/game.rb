class Game < ActiveRecord::Base

  self.inheritance_column = "class"

  STATUS = {:wait => 'wait', :start => 'start'}
  
  belongs_to :type, :class_name => 'GameType'
  has_many :players, :dependent => :delete_all
  has_many :users, :through => :players
  has_many :actions

  def minimal_bet
    blind_size * type.bet_multiplier
  end

  def small_blind_size
    blind_size / 2
  end

  def small_blind_position
    get_first_player_from blind_position, :out => :sit, :direction => :desc
  end

  def add_player user
    player = players.create(
      :user => user,
      :sit => players_count,
      :stack => type.start_stack
    ) if wait? and user.can_join?(self)
    if player
      max_players = type.max_players
      self.reload
      start if players_count == max_players
    end
    player
  end

  def wait?
    STATUS[:wait] == status
  end

  def wait_action_from user
    Player.find_by_id_and_user_id turn, user.id
  end

  def next_level
    if new_blind_size = type.get_blind_size(blind_level + 1)
      update_attributes(
        :blind_level => blind_level + 1,
        :blind_size => new_blind_size.value,
        :ante => new_blind_size.ante,
        :next_level_time => Time.now + type.change_level_time.minutes
      )
    else
      update_attribute(:next_level_time, nil)
    end if next_level_time and Time.now >= next_level_time
  end

  def start
    random_blind_sit = rand(type.max_players)
    params = {
      :status => STATUS[:start],
      :next_level_time => Time.now + type.change_level_time.minutes,
      :blind_position => random_blind_sit,
      :turn => get_first_player_from(random_blind_sit)
    }
    update_attributes(params)
    distribution
  end

  def next_turn
    current_player = Player.find self.turn
    player_id = get_first_player_from current_player.sit
    update_attribute :turn, player_id
  end

  # Ищет первое не пустое место начиная с sit в направлении :direction
  def get_first_player_from sit, params = {} 
    params[:out] ||= :id
    params[:direction] ||= :asc
    conditions = case params[:direction]
    when :asc
      {:first => ['sit > ?', sit], :order => 'sit ASC'}
    else
      {:first => ['sit < ?', sit], :order => 'sit DESC'}
    end
    player = players.first :conditions => conditions[:first], :order => conditions[:order]
    player = players.first(:order => conditions[:order]) unless player
    player.send(params[:out])
  end

  def active_players
    players.find_all{ |player| player.active? }
  end

  def distribution # раздача
    take_blinds
    #TODO генерация карт
  end

  def take_blinds
    players.each { |player| player.take_ante } if ante > 0
    players.select { |player| player.sit == blind_position }.first.take_chips blind_size
    players.select { |player| player.sit == small_blind_position }.first.take_chips small_blind_size
  end

  def ending_distribution
    groups = self.group_players
    groups.each_index do |group|
      general_in_pot = groups[group].inject(0){|s, p| s + p[:in_pot]}
      if general_in_pot > 0
        max = groups[group].first[:in_pot]
        groups[group].each_index{|player|
          max = groups[group][player][:in_pot] if groups[group][player][:in_pot] > max
          groups[group][player][:persent] = (groups[group][player][:in_pot] / general_in_pot).to_f.round(2)
        }
        chips_summ = 0
        groups.each_index { |i|
          groups[i].each_index { |p|
            if groups[i][p][:in_pot] > max
              chips_summ += max
              groups[i][p][:in_pot] -= max
            else
              chips_summ += groups[i][p][:in_pot]
              groups[i][p][:in_pot] = 0
            end
          }
        }
        groups[group].each_index { |player|
          groups[group][player][:stack] += (chips_summ * groups[group][player][:persent]).round
        }
      end
    end

    all_players=players
    groups.each_index { |i|
          groups[i].each_index { |p|
            player=all_players.find_by_id(groups[i][p][:id])
            player.update_attributes(
              :stack => groups[i][p][:stack],
              :in_pot =>groups[i][p][:in_pot]
            )
          }
    }

  end

  def group_players
    temp_players = players.map{|p| {
        :id => p.id,
        :hand => p.hand,
        :in_pot => p.in_pot,
        :stack => p.stack
      } if p.in_pot > 0
    }.sort_by{|p| p[:hand]}.reverse
    groups = []
    group =[]
    temp_players.each_index do |i|
      if 0 == i or temp_players[i][:hand] == temp_players[i-1][:hand]
        group.push temp_players[i]
      else
        groups.push group
        group = [temp_players[i]]
      end
    end
    groups.push group
  end
  
end
