class UserBalanceAction < ActiveRecord::Base

  belongs_to :user

  def self.in(user, value, title)
    UserBalanceAction.create(
      :direction => 'in',
      :user => user,
      :value => value,
      :comment => "Покинул игру '#{title}' до старта"
    )
  end

  def self.out(user, value, title)
    UserBalanceAction.create(
      :direction => 'out',
      :user => user,
      :value => value,
      :comment => "Присоединился к игре '#{title}'"
    )
  end
  
end
