class Player < ActiveRecord::Base

  STATE = {:active => 'active', :allin => 'allin', :pass => 'pass', :away => 'away'}

  validates_presence_of :user_id, :game_id, :sit, :stack

  belongs_to :user
  belongs_to :game, :counter_cache => :players_count
  has_many :actions

  before_destroy :return_money, :destroy_game_if_last
  before_create :take_money

  def do_action params
    action_name = Action::NAME_BY_KIND[params[:kind]]
    params[:value] ||= nil
    if self.send("can_do_#{action_name}?", params[:value]) and self.send("do_#{action_name}", params[:value])
      game.next_turn
      params[:game_id] = game.id
      self.actions.create params
    end
  end

  def take_chips value
    return 0 unless value
    self.reload
    params = {}
    if value >= stack
      params[:state] = STATE[:allin]
      value = stack
    end
    params[:stack] = stack - value
    params[:in_pot] = in_pot + value
    params[:for_call] = (for_call - value > 0 ? for_call - value : 0) if must_call?
    Player.update_all "for_call = for_call + #{value - for_call}", ["game_id = ? AND NOT id = ?", game_id, id] if value > for_call
    game_params = {:bank => game.bank + value}
    game_params[:current_bet] = in_pot + value if value > for_call
    update_attributes params
    game.update_attributes game_params
    value
  end

  def add_for_call value
    update_attribute :for_call, for_call + value
  end

  def take_ante
    update_attribure :stack, stack - game.ante
    game.update_attibute :bank, game.bank + game.ante
  end

  def active?
    STATE[:active] == state
  end

  def has_called?
    0 == for_call
  end

  def must_call?
    for_call > 0
  end

  protected

  def return_money
    user.update_attribute(:cash, user.cash + game.type.pay_for_play) if game.wait?
  end

  def take_money
    user.update_attribute(:cash, user.cash - game.type.pay_for_play)
  end

  def destroy_game_if_last
    game.destroy if 1 == game.players_count and Game.count(:conditions => ['status = "wait" AND type_id = ?', game.type_id]) > 1
  end

  def can_do_pass? value = nil
    true
  end

  def can_do_check? value = nil
    has_called?
  end

  def can_do_call? value = nil
    must_call?
  end

  def can_do_bet? value
    value ||= game.minimal_bet
    stack >= for_call + value and value >= game.minimal_bet and game.current_bet.nil?
  end

  def can_do_raise? value
    stack >= for_call + value and in_pot + for_call + value > game.current_bet
  end

  def stack_empty?
    0 == stack
  end

  def do_pass value = nil
    update_attribute :state, STATE[:pass]
  end

  def do_check value = nil
    true
  end

  def do_call value = nil
    take_chips(for_call)
  end

  def do_bet value = nil
    value ||= game.minimal_bet
    take_chips(value + for_call)
  end

  def do_raise value
    do_bet value
  end

end
