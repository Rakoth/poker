class UserBalanceAction < ActiveRecord::Base

  belongs_to :user

  def self.in(user, value, title, game = true)
    self.create(
      :direction => 'in',
      :user => user,
      :value => value,
      :comment => (game ? "Покинул игру '#{title}' до старта" : title)
    )
  end

  def self.out(user, value, title, game = true)
    self.create(
      :direction => 'out',
      :user => user,
      :value => value,
      :comment => (game ? "Присоединился к игре '#{title}'" : title)
    )
  end
  
end
